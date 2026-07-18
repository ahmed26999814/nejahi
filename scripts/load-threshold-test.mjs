import { writeFile } from "node:fs/promises";
import { performance } from "node:perf_hooks";

const BASE_URL = (process.env.BASE_URL || "https://mauri-results.vercel.app").replace(/\/$/, "");
const TIMEOUT_MS = Number(process.env.TIMEOUT_MS || 7000);
const TEST_ID = `mauriresults-origin-${new Date().toISOString().replace(/[:.]/g, "-")}`;

const stages = [
  { name: "origin_baseline", total: 20, concurrency: 1 },
  { name: "origin_c10", total: 150, concurrency: 10 },
  { name: "origin_c20", total: 240, concurrency: 20 },
  { name: "origin_c30", total: 300, concurrency: 30 },
  { name: "origin_c40", total: 360, concurrency: 40 },
  { name: "origin_c50", total: 400, concurrency: 50 },
  { name: "origin_c70", total: 500, concurrency: 70 },
];

function candidateNumber(stageIndex, requestIndex) {
  const seed = stageIndex * 10000 + requestIndex;
  return String(1 + ((seed * 7919 + 173) % 75694));
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

async function request(stageIndex, requestIndex) {
  const number = candidateNumber(stageIndex, requestIndex);
  const probe = `${TEST_ID}-${stageIndex}-${requestIndex}`;
  const path = `/api/search?source=upload%3Abrevet_2026&q=${encodeURIComponent(number)}&load_probe=${encodeURIComponent(probe)}`;
  const started = performance.now();
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), TIMEOUT_MS);

  try {
    const response = await fetch(`${BASE_URL}${path}`, {
      headers: {
        Accept: "application/json",
        "Cache-Control": "no-cache",
        "User-Agent": `MauriResults-Authorized-Origin-Test/1.0 (${TEST_ID})`,
        "X-MauriResults-Load-Test": TEST_ID,
      },
      signal: controller.signal,
      redirect: "follow",
    });
    const body = await response.text();
    const durationMs = performance.now() - started;
    const valid = response.status === 200 && body.includes('"rows"');
    return {
      status: response.status,
      durationMs,
      cache: response.headers.get("x-vercel-cache") || "none",
      valid,
      error: valid ? null : `status=${response.status}`,
    };
  } catch (error) {
    return {
      status: 0,
      durationMs: performance.now() - started,
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

  for (const item of results) {
    statuses[item.status] = (statuses[item.status] || 0) + 1;
    caches[item.cache] = (caches[item.cache] || 0) + 1;
  }

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
    sampleErrors: failures.slice(0, 15).map((item) => ({
      status: item.status,
      durationMs: round(item.durationMs),
      error: item.error,
    })),
  };
}

async function runStage(stage, stageIndex) {
  console.log(`\n=== ${stage.name}: ${stage.total} forced-origin requests @ concurrency ${stage.concurrency} ===`);
  const results = new Array(stage.total);
  let cursor = 0;
  const started = performance.now();

  async function worker() {
    while (true) {
      const index = cursor++;
      if (index >= stage.total) return;
      results[index] = await request(stageIndex, index);
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

for (let stageIndex = 0; stageIndex < stages.length; stageIndex += 1) {
  const stage = stages[stageIndex];
  const report = await runStage(stage, stageIndex);
  reports.push(report);

  if (stage.concurrency > 1 && (report.errorRate > 0.02 || report.latency.p95Ms > 3000)) {
    stopReason = `${stage.name}: errorRate=${report.errorRate}, p95=${report.latency.p95Ms}ms`;
    console.log(`Stopping further escalation: ${stopReason}`);
    break;
  }

  await new Promise((resolve) => setTimeout(resolve, 2500));
}

const totalRequests = reports.reduce((sum, item) => sum + item.completed, 0);
const totalFailures = reports.reduce((sum, item) => sum + item.failures, 0);
const report = {
  testId: TEST_ID,
  mode: "forced_origin_unique_queries",
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
console.log("\n=== FINAL ORIGIN THRESHOLD REPORT ===");
console.log(JSON.stringify(report, null, 2));
