import { writeFile } from "node:fs/promises";
import { performance } from "node:perf_hooks";

const BASE_URL = (process.env.BASE_URL || "https://deploy-preview-19--mauri-results.netlify.app").replace(/\/$/, "");
const TIMEOUT_MS = Number(process.env.TIMEOUT_MS || 10_000);
const REPORT_FILE = process.env.REPORT_FILE || "number-search-scale-report.json";
const TEST_ID = `number-search-v2-${new Date().toISOString().replace(/[:.]/g, "-")}`;
const BREVET_PATH = "/api/result-number/upload--brevet_2026";

function percentile(sorted, p) {
  if (!sorted.length) return 0;
  const position = (p / 100) * (sorted.length - 1);
  const lower = Math.floor(position);
  const upper = Math.ceil(position);
  if (lower === upper) return sorted[lower];
  return sorted[lower] + (sorted[upper] - sorted[lower]) * (position - lower);
}

function round(value, digits = 2) {
  const factor = 10 ** digits;
  return Math.round(value * factor) / factor;
}

async function request(path, { noCache = false, validate = () => true } = {}) {
  const started = performance.now();
  try {
    const response = await fetch(`${BASE_URL}${path}`, {
      redirect: "follow",
      signal: AbortSignal.timeout(TIMEOUT_MS),
      headers: {
        Accept: "application/json",
        "User-Agent": `MauriResults-Number-Scale-Test/2.1 (${TEST_ID})`,
        "X-MauriResults-Load-Test": TEST_ID,
        ...(noCache ? { "Cache-Control": "no-cache" } : {}),
      },
    });
    const body = await response.text();
    let parsed = null;
    try { parsed = body ? JSON.parse(body) : null; } catch {}
    const durationMs = performance.now() - started;
    const valid = validate({ response, parsed, body });
    return {
      status: response.status,
      durationMs,
      finalUrl: response.url,
      cache: response.headers.get("x-vercel-cache") || response.headers.get("cache-status") || "none",
      valid,
      error: valid ? null : `status=${response.status}, url=${response.url}, body=${body.slice(0, 240)}`,
    };
  } catch (error) {
    return {
      status: 0,
      durationMs: performance.now() - started,
      finalUrl: "",
      cache: "none",
      valid: false,
      error: error?.name === "TimeoutError" || error?.name === "AbortError"
        ? "timeout"
        : String(error?.message || error),
    };
  }
}

function rowNumber(row) {
  return String(
    row?.["Numéro_C1AS"]
    ?? row?.Numero_C1AS
    ?? row?.["Numéro"]
    ?? row?.Num_Bepc
    ?? row?.Numero
    ?? row?.NODOSS
    ?? "",
  ).trim();
}

async function waitForPreview() {
  const deadline = Date.now() + 8 * 60 * 1000;
  while (Date.now() < deadline) {
    const result = await request(`${BREVET_PATH}/75457`, {
      validate: ({ response, parsed }) =>
        response.status === 200
        && response.headers.get("x-mauri-search") === "NUMBER-LOOKUP"
        && rowNumber(parsed?.rows?.[0]).replace(/^0+/, "") === "75457",
    });
    if (result.valid) return result;
    await new Promise((resolve) => setTimeout(resolve, 10_000));
  }
  throw new Error("Path-based preview did not become ready");
}

async function functionalChecks() {
  const checks = [];
  const add = async (name, path, validate) => {
    checks.push({ name, result: await request(path, { validate }) });
  };

  await add("path_brevet_75457", `${BREVET_PATH}/75457`, ({ response, parsed }) =>
    response.status === 200
    && response.headers.get("x-mauri-search") === "NUMBER-LOOKUP"
    && rowNumber(parsed?.rows?.[0]).replace(/^0+/, "") === "75457");

  await add("legacy_redirect_75457", "/api/search?source=upload%3Abrevet_2026&q=75457", ({ response, parsed }) =>
    response.status === 200
    && response.url.endsWith("/api/result-number/upload--brevet_2026/75457")
    && rowNumber(parsed?.rows?.[0]).replace(/^0+/, "") === "75457");

  await add("arabic_digits", `/api/search?source=upload%3Abrevet_2026&q=${encodeURIComponent("٧٥٤٥٧")}`, ({ response, parsed }) =>
    response.status === 200 && rowNumber(parsed?.rows?.[0]).replace(/^0+/, "") === "75457");

  await add("name_rejected", "/api/search?source=upload%3Abrevet_2026&q=Mokhtar", ({ response, parsed }) =>
    response.status === 400 && Array.isArray(parsed?.rows) && parsed.rows.length === 0);

  await add("forgot_number_disabled", "/api/forgot-number?source=brevet&name=Mokhtar", ({ response, parsed }) =>
    response.status === 410 && parsed?.numberOnly === true);

  await add("bac_isolated", "/api/search?source=bac&q=00001", ({ response, parsed }) =>
    response.status === 200
    && response.url.endsWith("/api/result-number/bac/1")
    && rowNumber(parsed?.rows?.[0]).replace(/^0+/, "") === "1");

  await add("empty_isolated", `${BREVET_PATH}/75695`, ({ response, parsed }) =>
    response.status === 200 && Array.isArray(parsed?.rows) && parsed.rows.length === 0);

  const concours = new URLSearchParams({
    source: "upload:concour_2026",
    wilaya: "داخلت انواديـبـو",
    moughataa: "انواذيب",
    centre: "شنقيط 1",
    number: "106",
  });
  await add("concours_106", `/api/uploaded-concours-search?${concours}`, ({ response, parsed }) =>
    response.status === 200
    && response.url.includes("/api/concours-number/upload--concour_2026/")
    && rowNumber(parsed?.rows?.[0]).replace(/^0+/, "") === "106");

  return checks;
}

function uniqueCandidate(stageIndex, index) {
  const seed = stageIndex * 20_003 + index;
  return String(1 + ((seed * 7_919 + 173) % 75_694));
}

function summarize(stage, results, elapsedMs) {
  const durations = results.map((result) => result.durationMs).sort((a, b) => a - b);
  const failures = results.filter((result) => !result.valid);
  const statuses = {};
  const caches = {};
  for (const result of results) {
    statuses[result.status] = (statuses[result.status] || 0) + 1;
    caches[result.cache] = (caches[result.cache] || 0) + 1;
  }
  return {
    name: stage.name,
    concurrency: stage.concurrency,
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
  const results = new Array(stage.total);
  let cursor = 0;
  const started = performance.now();

  async function worker() {
    while (true) {
      const index = cursor++;
      if (index >= stage.total) return;
      const number = stage.cached ? "75457" : uniqueCandidate(stageIndex, index);
      results[index] = await request(`${BREVET_PATH}/${number}`, {
        noCache: !stage.cached,
        validate: ({ response, parsed }) =>
          response.status === 200
          && response.headers.get("x-mauri-search") === "NUMBER-LOOKUP"
          && Array.isArray(parsed?.rows),
      });
    }
  }

  await Promise.all(Array.from({ length: Math.min(stage.concurrency, stage.total) }, worker));
  return summarize(stage, results, performance.now() - started);
}

const startedAt = new Date().toISOString();
const report = {
  testId: TEST_ID,
  baseUrl: BASE_URL,
  startedAt,
  endedAt: null,
  functional: [],
  stages: [],
  verdict: "running",
  stopReason: null,
};

try {
  report.warmup = await waitForPreview();
  report.functional = await functionalChecks();
  const failedChecks = report.functional.filter((check) => !check.result.valid);
  if (failedChecks.length) {
    throw new Error(`Functional checks failed: ${failedChecks.map((check) => check.name).join(", ")}`);
  }

  const uniqueStages = [
    { name: "unique_c25", total: 250, concurrency: 25 },
    { name: "unique_c50", total: 500, concurrency: 50 },
    { name: "unique_c100", total: 1_000, concurrency: 100 },
    { name: "unique_c200", total: 1_500, concurrency: 200 },
    { name: "unique_c400", total: 2_000, concurrency: 400 },
    { name: "unique_c800", total: 3_000, concurrency: 800 },
    { name: "unique_c1200", total: 4_000, concurrency: 1_200 },
  ];

  for (let index = 0; index < uniqueStages.length; index += 1) {
    const stageReport = await runStage(uniqueStages[index], index);
    report.stages.push(stageReport);
    console.log(JSON.stringify(stageReport, null, 2));
    if (stageReport.errorRate > 0.01 || stageReport.latency.p95Ms > 3_000) {
      report.stopReason = `${stageReport.name}: errorRate=${stageReport.errorRate}, p95=${stageReport.latency.p95Ms}ms`;
      break;
    }
    await new Promise((resolve) => setTimeout(resolve, 2_000));
  }

  const cachedSpike = await runStage(
    { name: "cached_20k_spike", total: 20_000, concurrency: 5_000, cached: true },
    uniqueStages.length,
  );
  report.stages.push(cachedSpike);
  report.verdict = report.stopReason || cachedSpike.errorRate > 0.01 ? "limit_or_warning" : "pass";
} catch (error) {
  report.verdict = "failed";
  report.stopReason = String(error?.message || error);
  process.exitCode = 1;
} finally {
  report.endedAt = new Date().toISOString();
  report.totalRequests = report.stages.reduce((sum, stage) => sum + stage.requests, 0);
  report.totalFailures = report.stages.reduce((sum, stage) => sum + stage.failures, 0);
  report.overallErrorRate = round(report.totalFailures / Math.max(report.totalRequests, 1), 5);
  await writeFile(REPORT_FILE, `${JSON.stringify(report, null, 2)}\n`, "utf8");
  console.log("\n=== FINAL NUMBER SEARCH SCALE REPORT ===");
  console.log(JSON.stringify(report, null, 2));
}
