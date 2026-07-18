import { writeFile } from "node:fs/promises";
import { performance } from "node:perf_hooks";

const BASE_URL = (process.env.BASE_URL || "https://mauri-results.vercel.app").replace(/\/$/, "");
const TIMEOUT_MS = Number(process.env.TIMEOUT_MS || 7000);
const TEST_ID = `mauriresults-threshold-${new Date().toISOString().replace(/[:.]/g, "-")}`;

const stages = [
  { name: "baseline_endpoints", total: 24, concurrency: 1, stopOnFailure: false, build: baselineRequest },
  { name: "public_exams_burst", total: 300, concurrency: 75, stopOnFailure: false, build: () => publicExamsRequest() },
  { name: "analytics_load", total: 120, concurrency: 20, stopOnFailure: false, build: () => analyticsRequest() },
  { name: "search_mix_c25", total: 300, concurrency: 25, stopOnFailure: true, build: searchMixRequest },
  { name: "search_mix_c50", total: 500, concurrency: 50, stopOnFailure: true, build: searchMixRequest },
  { name: "search_mix_c75", total: 600, concurrency: 75, stopOnFailure: true, build: searchMixRequest },
  { name: "search_mix_c100", total: 700, concurrency: 100, stopOnFailure: true, build: searchMixRequest },
  { name: "search_mix_c150", total: 800, concurrency: 150, stopOnFailure: true, build: searchMixRequest },
];

function candidateNumber(index) {
  return String(1 + ((index * 7919 + 173) % 75694));
}

function spec(path, label, validate, accept = "application/json") {
  return { path, label, validate, accept };
}

function searchRequest(number, label) {
  return spec(
    `/api/search?source=upload%3Abrevet_2026&q=${encodeURIComponent(number)}`,
    label,
    (body) => body.includes('"rows"')
  );
}

function publicExamsRequest() {
  return spec("/api/public-exams", "public_exams", (body) => body.includes('"exams"'));
}

function analyticsRequest() {
  return spec(
    "/api/published-exam-analytics?source=upload%3Abrevet_2026",
    "analytics",
    (body) => body.includes('"stats"') || body.includes('"top_students"')
  );
}

function baselineRequest(index) {
  switch (index % 6) {
    case 0:
      return spec("/", "homepage", (body) => body.includes("MauriResults"), "text/html");
    case 1:
      return publicExamsRequest();
    case 2:
      return searchRequest("75457", "search_cached");
    case 3:
      return searchRequest(candidateNumber(index + 50000), "search_unique");
    case 4:
      return analyticsRequest();
    default:
      return searchRequest("75457", "search_cached");
  }
}

function searchMixRequest(index) {
  return index % 5 < 2
    ? searchRequest("75457", "search_cached")
    : searchRequest(candidateNumber(index + 1000), "search_unique");
}

function percentile(sorted, value) {
  if (!sorted.length) return 0;
  const rank = (value / 100) * (sorted.length - 1);
  const low = Math.floor(rank);
  const high = Math.ceil(rank);
  if (low === high) return sorted[low];
  return sorted[low] + (sorted[high] - sorted[low]) * (rank - low);
}

function round(value, digits = 2) {
  const factor = 10 ** digits;
  return Math.round(value * factor) / factor;
}

async function request(requestSpec) {
  const started = performance.now();
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), TIMEOUT_MS);

  try {
    const response = await fetch(`${BASE_URL}${requestSpec.path}`, {
      headers: {
        Accept: requestSpec.accept,
        "User-Agent": `MauriResults-Authorized-Load-Test/1.0 (${TEST_ID})`,
        "X-MauriResults-Load-Test": TEST_ID,
      },
      signal: controller.signal,
      redirect: "follow",
    });
    const body = await response.text();
    const durationMs = performance.now() - started;
    const valid = response.status === 200 && requestSpec.validate(body);
    return {
      label: requestSpec.label,
      status: response.status,
      durationMs,
      bytes: Buffer.byteLength(body),
      cache: response.headers.get("x-vercel-cache") || "none",
      valid,
      error: valid ? null : `status=${response.status}`,
    };
  } catch (error) {
    return {
      label: requestSpec.label,
      status: 0,
      durationMs: performance.now() - started,
      bytes: 0,
      cache: "none",
      valid: false,
      error: error?.name === "AbortError" ? "timeout" : String(error?.message || error),
    };
  } finally {
    clearTimeout(timeout);
  }
}

function summarize(stage, results, elapsedMs) {
  const durations = results.map((item) => item.durationMs).sort((a, b) => a - b);
  const failures = results.filter((item) => !item.valid);
  const statuses = {};
  const caches = {};
  const grouped = {};

  for (const item of results) {
    statuses[item.status] = (statuses[item.status] || 0) + 1;
    caches[item.cache] = (caches[item.cache] || 0) + 1;
    grouped[item.label] ||= [];
    grouped[item.label].push(item);
  }

  const endpoints = Object.fromEntries(Object.entries(grouped).map(([label, items]) => {
    const values = items.map((item) => item.durationMs).sort((a, b) => a - b);
    const failed = items.filter((item) => !item.valid).length;
    return [label, {
      requests: items.length,
      failures: failed,
      errorRate: round(failed / items.length, 5),
      p50Ms: round(percentile(values, 50)),
      p95Ms: round(percentile(values, 95)),
      p99Ms: round(percentile(values, 99)),
      maxMs: round(values.at(-1) || 0),
    }];
  }));

  return {
    name: stage.name,
    concurrency: stage.concurrency,
    completed: results.length,
    elapsedMs: round(elapsedMs),
    requestsPerSecond: round(results.length / (elapsedMs / 1000)),
    failures: failures.length,
    errorRate: round(failures.length / Math.max(results.length, 1), 5),
    latency: {
      p50Ms: round(percentile(durations, 50)),
      p90Ms: round(percentile(durations, 90)),
      p95Ms: round(percentile(durations, 95)),
      p99Ms: round(percentile(durations, 99)),
      maxMs: round(durations.at(-1) || 0),
      averageMs: round(durations.reduce((sum, value) => sum + value, 0) / Math.max(durations.length, 1)),
    },
    statuses,
    caches,
    endpoints,
    sampleErrors: failures.slice(0, 12).map((item) => ({
      label: item.label,
      status: item.status,
      durationMs: round(item.durationMs),
      error: item.error,
    })),
  };
}

async function runStage(stage) {
  console.log(`\n=== ${stage.name}: ${stage.total} requests @ concurrency ${stage.concurrency} ===`);
  const results = new Array(stage.total);
  let cursor = 0;
  const started = performance.now();

  async function worker() {
    while (true) {
      const index = cursor++;
      if (index >= stage.total) return;
      results[index] = await request(stage.build(index));
    }
  }

  await Promise.all(Array.from({ length: Math.min(stage.concurrency, stage.total) }, worker));
  const report = summarize(stage, results, performance.now() - started);
  console.log(JSON.stringify(report, null, 2));
  return report;
}

const startedAt = new Date().toISOString();
const reports = [];
let stopReason = null;

for (const stage of stages) {
  const report = await runStage(stage);
  reports.push(report);

  if (stage.stopOnFailure && (report.errorRate > 0.02 || report.latency.p95Ms > 3000)) {
    stopReason = `${stage.name}: errorRate=${report.errorRate}, p95=${report.latency.p95Ms}ms`;
    console.log(`Stopping further escalation: ${stopReason}`);
    break;
  }

  await new Promise((resolve) => setTimeout(resolve, 2000));
}

const totalRequests = reports.reduce((sum, item) => sum + item.completed, 0);
const totalFailures = reports.reduce((sum, item) => sum + item.failures, 0);
const report = {
  testId: TEST_ID,
  baseUrl: BASE_URL,
  startedAt,
  endedAt: new Date().toISOString(),
  timeoutMs: TIMEOUT_MS,
  totalRequests,
  totalFailures,
  overallErrorRate: round(totalFailures / Math.max(totalRequests, 1), 5),
  peakConcurrency: Math.max(...reports.map((item) => item.concurrency)),
  verdict: stopReason ? "limit_found" : totalFailures ? "warning" : "pass",
  stopReason,
  stages: reports,
};

await writeFile("load-threshold-report.json", `${JSON.stringify(report, null, 2)}\n`, "utf8");
console.log("\n=== FINAL THRESHOLD REPORT ===");
console.log(JSON.stringify(report, null, 2));
