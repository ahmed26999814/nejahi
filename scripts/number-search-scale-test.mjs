import { writeFile } from "node:fs/promises";
import { performance } from "node:perf_hooks";

const BASE_URL = (process.env.BASE_URL || "https://deploy-preview-19--mauri-results.netlify.app").replace(/\/$/, "");
const TIMEOUT_MS = Number(process.env.TIMEOUT_MS || 8_000);
const REPORT_FILE = process.env.REPORT_FILE || "number-search-scale-report.json";
const TEST_ID = `number-search-${new Date().toISOString().replace(/[:.]/g, "-")}`;
const BREVET_PATH = "/api/result-number/upload--brevet_2026";

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

async function request(path, { noCache = false, validate = () => true } = {}) {
  const started = performance.now();
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), TIMEOUT_MS);

  try {
    const response = await fetch(`${BASE_URL}${path}`, {
      redirect: "follow",
      signal: controller.signal,
      headers: {
        Accept: "application/json",
        "User-Agent": `MauriResults-Number-Scale-Test/2.0 (${TEST_ID})`,
        "X-MauriResults-Load-Test": TEST_ID,
        ...(noCache ? { "Cache-Control": "no-cache" } : {}),
      },
    });
    const body = await response.text();
    const durationMs = performance.now() - started;
    let parsed = null;
    try { parsed = body ? JSON.parse(body) : null; } catch {}
    const valid = validate({ response, body, parsed });
    return {
      status: response.status,
      durationMs,
      finalUrl: response.url,
      cache: response.headers.get("x-vercel-cache") || response.headers.get("cache-status") || "none",
      searchMode: response.headers.get("x-mauri-search") || "",
      valid,
      error: valid ? null : `status=${response.status}, url=${response.url}, body=${body.slice(0, 220)}`,
    };
  } catch (error) {
    return {
      status: 0,
      durationMs: performance.now() - started,
      finalUrl: "",
      cache: "none",
      searchMode: "",
      valid: false,
      error: error?.name === "AbortError" ? "timeout" : String(error?.message || error),
    };
  } finally {
    clearTimeout(timeout);
  }
}

function candidateNumber(row) {
  return String(row?.["Numéro"] ?? row?.Num_Bepc ?? row?.Numero ?? row?.NODOSS ?? "").trim();
}

async function waitForLatestPreview() {
  const deadline = Date.now() + 8 * 60 * 1000;
  while (Date.now() < deadline) {
    const result = await request(`${BREVET_PATH}/75457`, {
      validate: ({ response, parsed }) =>
        response.status === 200
        && response.headers.get("x-mauri-search") === "NUMBER-LOOKUP"
        && Array.isArray(parsed?.rows)
        && parsed.rows.length === 1
        && candidateNumber(parsed.rows[0]).replace(/^0+/, "") === "75457",
    });
    if (result.valid) return result;
    console.log(`Preview not ready yet: ${result.error || result.status}`);
    await new Promise((resolve) => setTimeout(resolve, 10_000));
  }
  throw new Error("Latest preview did not become ready with the path-based NUMBER-LOOKUP route");
}

async function functionalChecks() {
  const checks = [];

  checks.push({
    name: "path_brevet_exact_number",
    result: await request(`${BREVET_PATH}/75457`, {
      validate: ({ response, parsed }) =>
        response.status === 200
        && response.headers.get("x-mauri-search") === "NUMBER-LOOKUP"
        && Array.isArray(parsed?.rows)
        && parsed.rows.length === 1
        && candidateNumber(parsed.rows[0]).replace(/^0+/, "") === "75457",
    }),
  });

  checks.push({
    name: "legacy_query_redirect",
    result: await request("/api/search?source=upload%3Abrevet_2026&q=75457", {
      validate: ({ response, parsed }) =>
        response.status === 200
        && response.url.includes("/api/result-number/upload--brevet_2026/75457")
        && Array.isArray(parsed?.rows)
        && candidateNumber(parsed.rows[0]).replace(/^0+/, "") === "75457",
    }),
  });

  checks.push({
    name: "brevet_leading_zeros",
    result: await request("/api/search?source=upload%3Abrevet_2026&q=00075457", {
      validate: ({ response, parsed }) =>
        response.status === 200
        && response.url.endsWith("/api/result-number/upload--brevet_2026/75457")
        && Array.isArray(parsed?.rows)
        && candidateNumber(parsed.rows[0]).replace(/^0+/, "") === "75457",
    }),
  });

  checks.push({
    name: "arabic_digits",
    result: await request(`/api/search?source=upload%3Abrevet_2026&q=${encodeURIComponent("٧٥٤٥٧")}`, {
      validate: ({ response, parsed }) =>
        response.status === 200
        && Array.isArray(parsed?.rows)
        && candidateNumber(parsed.rows[0]).replace(/^0+/, "") === "75457",
    }),
  });

  checks.push({
    name: "name_search_rejected",
    result: await request("/api/search?source=upload%3Abrevet_2026&q=Mokhtar", {
      validate: ({ response, parsed }) =>
        response.status === 400
        && Array.isArray(parsed?.rows)
        && parsed.rows.length === 0,
    }),
  });

  checks.push({
    name: "forgot_number_disabled",
    result: await request("/api/forgot-number?source=brevet&name=Mokhtar", {
      validate: ({ response, parsed }) => response.status === 410 && parsed?.numberOnly === true,
    }),
  });

  checks.push({
    name: "legacy_bac_number_isolated",
    result: await request("/api/search?source=bac&q=00001", {
      validate: ({ response, parsed }) =>
        response.status === 200
        && response.url.endsWith("/api/result-number/bac/1")
        && Array.isArray(parsed?.rows)
        && parsed.rows.length >= 1
        && candidateNumber(parsed.rows[0]).replace(/^0+/, "") === "1",
    }),
  });

  checks.push({
    name: "empty_number_does_not_reuse_cache",
    result: await request(`${BREVET_PATH}/75695`, {
      validate: ({ response, parsed }) =>
        response.status === 200
        && Array.isArray(parsed?.rows)
        && parsed.rows.length === 0,
    }),
  });

  const concoursParams = new URLSearchParams({
    source: "upload:concour_2026",
    wilaya: "داخلت انواديـبـو",
    moughataa: "انواذيب",
    centre: "شنقيط 1",
    number: "106",
  });
  checks.push({
    name: "concours_guided_number",
    result: await request(`/api/uploaded-concours-search?${concoursParams}`, {
      validate: ({ response, parsed }) =>
        response.status === 200
        && response.url.includes("/api/concours-number/upload--concour_2026/")
        && Array.isArray(parsed?.rows)
        && parsed.rows.length === 1
        && candidateNumber(parsed.rows[0]).replace(/^0+/, "") === "106",
    }),
  });

  const failed = checks.filter((check) => !check.result.valid);
  console.log("\n=== FUNCTIONAL CHECKS ===");
  console.log(JSON.stringify(checks, null, 2));
  if (failed.length) {
    throw new Error(`Functional checks failed: ${failed.map((item) => item.name).join(", ")}`);
  }
  return checks;
}

function uniqueCandidate(stageIndex, requestIndex) {
  const seed = stageIndex * 20_003 + requestIndex;
  return String(1 + ((seed * 7_919 + 173) % 75_694));
}

function summarize(name, concurrency, results, elapsedMs) {
  const durations = results.map((item) => item.durationMs).sort((a, b) => a - b);
  const failures = results.filter((item) => !item.valid);
  const statuses = {};
  const caches = {};
  for (const item of results) {
    statuses[item.status] = (statuses[item.status] || 0) + 1;
    caches[item.cache] = (caches[item.cache] || 0) + 1;
  }

  return {
    name,
    concurrency,
    requests: results.length,
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
    sampleErrors: failures.slice(0, 12).map(({ status, durationMs, error }) => ({
      status,
      durationMs: round(durationMs),
      error,
    })),
  };
}

async function runStage(stage, stageIndex) {
  console.log(`\n=== ${stage.name}: ${stage.total} requests @ concurrency ${stage.concurrency} ===`);
  const results = new Array(stage.total);
  let cursor = 0;
  const started = performance.now();

  async function worker() {
    while (true) {
      const index = cursor++;
      if (index >= stage.total) return;
      const candidate = stage.cached ? "75457" : uniqueCandidate(stageIndex, index);
      results[index] = await request(
        `${BREVET_PATH}/${candidate}`,
        {
          noCache: !stage.cached,
          validate: ({ response, parsed }) =>
            response.status === 200
            && response.headers.get("x-mauri-search") === "NUMBER-LOOKUP"
            && Array.isArray(parsed?.rows),
        },
      );
    }
  }

  await Promise.all(Array.from({ length: Math.min(stage.concurrency, stage.total) }, worker));
  const summary = summarize(stage.name, stage.concurrency, results, performance.now() - started);
  console.log(JSON.stringify(summary, null, 2));
  return summary;
}

const originStages = [
  { name: "unique_c25", total: 250, concurrency: 25 },
  { name: "unique_c50", total: 500, concurrency: 50 },
  { name: "unique_c100", total: 1_000, concurrency: 100 },
  { name: "unique_c200", total: 1_500, concurrency: 200 },
  { name: "unique_c400", total: 2_000, concurrency: 400 },
  { name: "unique_c800", total: 3_000, concurrency: 800 },
  { name: "unique_c1200", total: 4_000, concurrency: 1_200 },
];

const startedAt = new Date().toISOString();
const warmup = await waitForLatestPreview();
const functional = await functionalChecks();
const stages = [];
let stopReason = null;

for (let index = 0; index < originStages.length; index += 1) {
  const report = await runStage(originStages[index], index);
  stages.push(report);
  if (report.errorRate > 0.01 || report.latency.p95Ms > 3_000) {
    stopReason = `${report.name}: errorRate=${report.errorRate}, p95=${report.latency.p95Ms}ms`;
    console.log(`Stopping unique-query escalation: ${stopReason}`);
    break;
  }
  await new Promise((resolve) => setTimeout(resolve, 2_000));
}

const cachedSpike = await runStage(
  { name: "cached_20k_spike", total: 20_000, concurrency: 5_000, cached: true },
  originStages.length,
);
stages.push(cachedSpike);

const totalRequests = stages.reduce((sum, item) => sum + item.requests, 0);
const totalFailures = stages.reduce((sum, item) => sum + item.failures, 0);
const uniqueStages = stages.filter((item) => item.name.startsWith("unique_"));
const report = {
  testId: TEST_ID,
  baseUrl: BASE_URL,
  startedAt,
  endedAt: new Date().toISOString(),
  warmup,
  functional,
  totalRequests,
  totalFailures,
  overallErrorRate: round(totalFailures / Math.max(totalRequests, 1), 5),
  highestUniqueConcurrency: uniqueStages.length ? Math.max(...uniqueStages.map((item) => item.concurrency)) : 0,
  cachedSpikeRequests: cachedSpike.requests,
  cachedSpikeConcurrency: cachedSpike.concurrency,
  verdict: stopReason || cachedSpike.errorRate > 0.01 ? "limit_or_warning" : "pass",
  stopReason,
  stages,
};

await writeFile(REPORT_FILE, `${JSON.stringify(report, null, 2)}\n`, "utf8");
console.log("\n=== FINAL NUMBER SEARCH SCALE REPORT ===");
console.log(JSON.stringify(report, null, 2));

if (cachedSpike.errorRate > 0.01) {
  process.exitCode = 1;
}
