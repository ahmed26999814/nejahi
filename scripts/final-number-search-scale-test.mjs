import { writeFile } from "node:fs/promises";
import { performance } from "node:perf_hooks";

const BASE_URL = (process.env.BASE_URL || "https://deploy-preview-19--mauri-results.netlify.app").replace(/\/$/, "");
const TIMEOUT_MS = Number(process.env.TIMEOUT_MS || 10_000);
const REPORT_FILE = process.env.REPORT_FILE || "number-search-scale-report.json";
const TEST_ID = `final-number-search-${new Date().toISOString().replace(/[:.]/g, "-")}`;
const BREVET_PATH = "/api/result-number/upload--brevet_2026";

const round = (value, digits = 2) => Math.round(value * (10 ** digits)) / (10 ** digits);
function percentile(sorted, p) {
  if (!sorted.length) return 0;
  const point = (p / 100) * (sorted.length - 1);
  const low = Math.floor(point);
  const high = Math.ceil(point);
  return low === high ? sorted[low] : sorted[low] + (sorted[high] - sorted[low]) * (point - low);
}

async function call(path, validate, noCache = false) {
  const started = performance.now();
  try {
    const response = await fetch(`${BASE_URL}${path}`, {
      redirect: "follow",
      signal: AbortSignal.timeout(TIMEOUT_MS),
      headers: {
        Accept: "application/json",
        "User-Agent": `MauriResults-Final-Scale-Test/1.0 (${TEST_ID})`,
        "X-MauriResults-Load-Test": TEST_ID,
        ...(noCache ? { "Cache-Control": "no-cache" } : {}),
      },
    });
    const body = await response.text();
    let data = null;
    try { data = body ? JSON.parse(body) : null; } catch {}
    const durationMs = performance.now() - started;
    const valid = validate({ response, data, body });
    return {
      status: response.status,
      durationMs,
      finalUrl: response.url,
      cache: response.headers.get("x-vercel-cache") || response.headers.get("cache-status") || "none",
      valid,
      error: valid ? null : `status=${response.status}, url=${response.url}, body=${body.slice(0, 220)}`,
    };
  } catch (error) {
    return {
      status: 0,
      durationMs: performance.now() - started,
      finalUrl: "",
      cache: "none",
      valid: false,
      error: error?.name === "TimeoutError" || error?.name === "AbortError" ? "timeout" : String(error?.message || error),
    };
  }
}

function numberOf(row) {
  return String(row?.["Numéro_C1AS"] ?? row?.Numero_C1AS ?? row?.["Numéro"] ?? row?.Num_Bepc ?? row?.Numero ?? row?.NODOSS ?? "").trim();
}
const normalized = (value) => String(value || "").replace(/^0+/, "") || "0";

async function waitForPreview() {
  const deadline = Date.now() + 8 * 60 * 1000;
  while (Date.now() < deadline) {
    const probe = await call(`${BREVET_PATH}/75457`, ({ response, data }) =>
      response.status === 200
      && response.headers.get("x-mauri-search") === "NUMBER-LOOKUP"
      && normalized(numberOf(data?.rows?.[0])) === "75457");
    if (probe.valid) return probe;
    await new Promise((resolve) => setTimeout(resolve, 10_000));
  }
  throw new Error("Preview did not become ready");
}

async function functionalChecks() {
  const checks = [];
  const test = async (name, path, validate) => checks.push({ name, result: await call(path, validate) });

  await test("direct_brevet", `${BREVET_PATH}/75457`, ({ response, data }) =>
    response.status === 200 && normalized(numberOf(data?.rows?.[0])) === "75457");

  await test("legacy_redirect", "/api/search?source=upload%3Abrevet_2026&q=75457", ({ response, data }) =>
    response.status === 200
    && response.url.includes("/api/result-number/upload--brevet_2026/75457")
    && normalized(numberOf(data?.rows?.[0])) === "75457");

  await test("arabic_digits", `/api/search?source=upload%3Abrevet_2026&q=${encodeURIComponent("٧٥٤٥٧")}`, ({ response, data }) =>
    response.status === 200 && normalized(numberOf(data?.rows?.[0])) === "75457");

  await test("name_rejected", "/api/search?source=upload%3Abrevet_2026&q=Mokhtar", ({ response, data }) =>
    response.status === 400 && Array.isArray(data?.rows) && data.rows.length === 0);

  await test("forgot_number_disabled", "/api/forgot-number?source=brevet&name=Mokhtar", ({ response, data }) =>
    response.status === 410 && data?.numberOnly === true);

  await test("bac_isolated", "/api/search?source=bac&q=00001", ({ response, data }) =>
    response.status === 200
    && response.url.includes("/api/result-number/bac/1")
    && normalized(numberOf(data?.rows?.[0])) === "1");

  await test("empty_isolated", `${BREVET_PATH}/99999999999999999999`, ({ response, data }) =>
    response.status === 200 && Array.isArray(data?.rows) && data.rows.length === 0);

  const concours = new URLSearchParams({
    source: "upload:concour_2026",
    wilaya: "داخلت انواديـبـو",
    moughataa: "انواذيب",
    centre: "شنقيط 1",
    number: "106",
  });
  await test("concours_isolated", `/api/uploaded-concours-search?${concours}`, ({ response, data }) =>
    response.status === 200
    && response.url.includes("/api/concours-number/upload--concour_2026/")
    && normalized(numberOf(data?.rows?.[0])) === "106");

  return checks;
}

function candidate(stageIndex, requestIndex) {
  const seed = stageIndex * 20_003 + requestIndex;
  return String(1 + ((seed * 7_919 + 173) % 75_694));
}

function summarize(stage, results, elapsedMs) {
  const durations = results.map((item) => item.durationMs).sort((a, b) => a - b);
  const failed = results.filter((item) => !item.valid);
  const statuses = {};
  const caches = {};
  for (const item of results) {
    statuses[item.status] = (statuses[item.status] || 0) + 1;
    caches[item.cache] = (caches[item.cache] || 0) + 1;
  }
  return {
    name: stage.name,
    concurrency: stage.concurrency,
    requests: results.length,
    elapsedMs: round(elapsedMs),
    requestsPerSecond: round(results.length / (elapsedMs / 1000)),
    failures: failed.length,
    errorRate: round(failed.length / Math.max(results.length, 1), 5),
    latency: {
      p50Ms: round(percentile(durations, 50)),
      p90Ms: round(percentile(durations, 90)),
      p95Ms: round(percentile(durations, 95)),
      p99Ms: round(percentile(durations, 99)),
      maxMs: round(durations.at(-1) || 0),
    },
    statuses,
    caches,
    sampleErrors: failed.slice(0, 10).map(({ status, durationMs, error }) => ({ status, durationMs: round(durationMs), error })),
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
      const number = stage.cached ? "75457" : candidate(stageIndex, index);
      results[index] = await call(`${BREVET_PATH}/${number}`, ({ response, data }) =>
        response.status === 200
        && response.headers.get("x-mauri-search") === "NUMBER-LOOKUP"
        && Array.isArray(data?.rows), !stage.cached);
    }
  }
  await Promise.all(Array.from({ length: Math.min(stage.concurrency, stage.total) }, worker));
  return summarize(stage, results, performance.now() - started);
}

const report = {
  testId: TEST_ID,
  baseUrl: BASE_URL,
  startedAt: new Date().toISOString(),
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
  if (failedChecks.length) throw new Error(`Functional checks failed: ${failedChecks.map((check) => check.name).join(", ")}`);

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
    const stage = await runStage(uniqueStages[index], index);
    report.stages.push(stage);
    console.log(JSON.stringify(stage, null, 2));
    if (stage.errorRate > 0.01 || stage.latency.p95Ms > 3_000) {
      report.stopReason = `${stage.name}: errorRate=${stage.errorRate}, p95=${stage.latency.p95Ms}ms`;
      break;
    }
    await new Promise((resolve) => setTimeout(resolve, 2_000));
  }

  const spike = await runStage({ name: "cached_20k_spike", total: 20_000, concurrency: 5_000, cached: true }, uniqueStages.length);
  report.stages.push(spike);
  report.verdict = report.stopReason || spike.errorRate > 0.01 ? "limit_or_warning" : "pass";
  if (spike.errorRate > 0.01) process.exitCode = 1;
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
  console.log(JSON.stringify(report, null, 2));
}
