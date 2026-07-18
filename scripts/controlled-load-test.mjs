import { writeFile } from "node:fs/promises";
import { performance } from "node:perf_hooks";

const BASE_URL = (process.env.BASE_URL || "https://mauri-results.vercel.app").replace(/\/$/, "");
const TIMEOUT_MS = Number(process.env.TIMEOUT_MS || 8000);
const TEST_ID = `mauriresults-${new Date().toISOString().replace(/[:.]/g, "-")}`;

const stages = [
  {
    name: "baseline_mixed",
    total: 30,
    concurrency: 1,
    build: (index) => mixedRequest(index),
  },
  {
    name: "cached_search_warm",
    total: 400,
    concurrency: 25,
    build: () => searchRequest("75457", "search_cached"),
  },
  {
    name: "cached_search_load",
    total: 1200,
    concurrency: 100,
    build: () => searchRequest("75457", "search_cached"),
  },
  {
    name: "cached_search_spike",
    total: 1600,
    concurrency: 250,
    build: (index) => index % 4 === 0
      ? jsonRequest("/api/public-exams", "public_exams", (body) => body.includes('"exams"'))
      : searchRequest("75457", "search_cached"),
  },
  {
    name: "unique_search_origin",
    total: 700,
    concurrency: 70,
    build: (index) => searchRequest(uniqueCandidate(index), "search_unique"),
  },
  {
    name: "mixed_read_load",
    total: 1400,
    concurrency: 120,
    build: (index) => mixedRequest(index + 10000),
  },
];

function uniqueCandidate(index) {
  const value = 1 + ((index * 7919 + 173) % 75694);
  return String(value);
}

function searchRequest(candidate, label) {
  return jsonRequest(
    `/api/search?source=upload%3Abrevet_2026&q=${encodeURIComponent(candidate)}`,
    label,
    (body) => body.includes('"rows"')
  );
}

function jsonRequest(path, label, validate = () => true) {
  return { path, label, validate, accept: "application/json" };
}

function mixedRequest(index) {
  const bucket = index % 20;
  if (bucket < 2) {
    return { path: "/", label: "homepage", validate: (body) => body.includes("MauriResults"), accept: "text/html" };
  }
  if (bucket < 6) {
    return jsonRequest("/api/public-exams", "public_exams", (body) => body.includes('"exams"'));
  }
  if (bucket < 15) {
    return searchRequest(bucket % 3 === 0 ? uniqueCandidate(index) : "75457", bucket % 3 === 0 ? "search_unique" : "search_cached");
  }
  if (bucket < 18) {
    return jsonRequest(
      "/api/published-exam-analytics?source=upload%3Abrevet_2026",
      "analytics",
      (body) => body.includes('"stats"') || body.includes('"top_students"')
    );
  }
  return jsonRequest("/api/health", "health", () => true);
}

function percentile(sorted, p) {
  if (!sorted.length) return 0;
  const rank = (p / 100) * (sorted.length - 1);
  const low = Math.floor(rank);
  const high = Math.ceil(rank);
  if (low === high) return sorted[low];
  return sorted[low] + (sorted[high] - sorted[low]) * (rank - low);
}

function round(value, digits = 2) {
  const factor = 10 ** digits;
  return Math.round(value * factor) / factor;
}

async function makeRequest(spec) {
  const started = performance.now();
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), TIMEOUT_MS);

  try {
    const response = await fetch(`${BASE_URL}${spec.path}`, {
      method: "GET",
      headers: {
        Accept: spec.accept,
        "User-Agent": `MauriResults-Controlled-Load-Test/1.0 (${TEST_ID})`,
        "X-MauriResults-Load-Test": TEST_ID,
      },
      redirect: "follow",
      signal: controller.signal,
    });
    const body = await response.text();
    const durationMs = performance.now() - started;
    const valid = response.status === 200 && spec.validate(body);

    return {
      label: spec.label,
      status: response.status,
      durationMs,
      bytes: Buffer.byteLength(body),
      cache: response.headers.get("x-vercel-cache") || "none",
      valid,
      error: valid ? null : `status=${response.status}, valid=${valid}`,
    };
  } catch (error) {
    return {
      label: spec.label,
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

function summarize(results, elapsedMs, stage) {
  const durations = results.map((item) => item.durationMs).sort((a, b) => a - b);
  const failures = results.filter((item) => !item.valid);
  const statusCounts = {};
  const cacheCounts = {};
  const endpointGroups = {};

  for (const item of results) {
    statusCounts[item.status] = (statusCounts[item.status] || 0) + 1;
    cacheCounts[item.cache] = (cacheCounts[item.cache] || 0) + 1;
    endpointGroups[item.label] ||= [];
    endpointGroups[item.label].push(item);
  }

  const endpoints = Object.fromEntries(
    Object.entries(endpointGroups).map(([label, items]) => {
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
    })
  );

  return {
    name: stage.name,
    requested: stage.total,
    concurrency: stage.concurrency,
    completed: results.length,
    elapsedMs: round(elapsedMs),
    requestsPerSecond: round(results.length / (elapsedMs / 1000)),
    failures: failures.length,
    errorRate: round(failures.length / Math.max(results.length, 1), 5),
    latency: {
      minMs: round(durations[0] || 0),
      p50Ms: round(percentile(durations, 50)),
      p90Ms: round(percentile(durations, 90)),
      p95Ms: round(percentile(durations, 95)),
      p99Ms: round(percentile(durations, 99)),
      maxMs: round(durations.at(-1) || 0),
      averageMs: round(durations.reduce((sum, value) => sum + value, 0) / Math.max(durations.length, 1)),
    },
    statusCounts,
    cacheCounts,
    transferredBytes: results.reduce((sum, item) => sum + item.bytes, 0),
    endpoints,
    sampleErrors: failures.slice(0, 10).map(({ label, status, durationMs, error }) => ({
      label,
      status,
      durationMs: round(durationMs),
      error,
    })),
  };
}

async function runStage(stage) {
  console.log(`\n=== ${stage.name}: ${stage.total} requests, concurrency ${stage.concurrency} ===`);
  const results = new Array(stage.total);
  let cursor = 0;
  const started = performance.now();

  async function worker() {
    while (true) {
      const index = cursor++;
      if (index >= stage.total) return;
      results[index] = await makeRequest(stage.build(index));
    }
  }

  await Promise.all(Array.from({ length: Math.min(stage.concurrency, stage.total) }, () => worker()));
  const summary = summarize(results, performance.now() - started, stage);
  console.log(JSON.stringify(summary, null, 2));
  return summary;
}

function aggregate(stageReports, startedAt, endedAt) {
  const totalRequests = stageReports.reduce((sum, stage) => sum + stage.completed, 0);
  const totalFailures = stageReports.reduce((sum, stage) => sum + stage.failures, 0);
  const peakConcurrency = Math.max(...stageReports.map((stage) => stage.concurrency));
  const unsafeStage = stageReports.find((stage) => stage.errorRate > 0.05 || stage.latency.p95Ms > 5000);
  const warningStage = stageReports.find((stage) => stage.errorRate > 0.01 || stage.latency.p95Ms > 3000);

  return {
    testId: TEST_ID,
    baseUrl: BASE_URL,
    startedAt,
    endedAt,
    timeoutMs: TIMEOUT_MS,
    totalRequests,
    totalFailures,
    overallErrorRate: round(totalFailures / Math.max(totalRequests, 1), 5),
    peakConcurrency,
    verdict: unsafeStage ? "unsafe" : warningStage ? "warning" : "pass",
    stopReason: unsafeStage
      ? `${unsafeStage.name}: errorRate=${unsafeStage.errorRate}, p95=${unsafeStage.latency.p95Ms}ms`
      : null,
    stages: stageReports,
  };
}

const startedAt = new Date().toISOString();
const stageReports = [];

for (const stage of stages) {
  const result = await runStage(stage);
  stageReports.push(result);

  if (result.errorRate > 0.05 || result.latency.p95Ms > 5000) {
    console.log(`Stopping escalation after ${stage.name} to protect production.`);
    break;
  }

  await new Promise((resolve) => setTimeout(resolve, 1500));
}

const report = aggregate(stageReports, startedAt, new Date().toISOString());
await writeFile("load-test-report.json", `${JSON.stringify(report, null, 2)}\n`, "utf8");

console.log("\n=== FINAL LOAD TEST REPORT ===");
console.log(JSON.stringify(report, null, 2));
console.log(`REPORT_FILE=load-test-report.json`);
