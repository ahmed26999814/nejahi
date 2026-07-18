import { writeFile } from "node:fs/promises";
import { performance } from "node:perf_hooks";

const BASE_URL = (process.env.BASE_URL || "https://deploy-preview-19--mauri-results.netlify.app").replace(/\/$/, "");
const MODE = process.env.MODE || "functional";
const SHARD = Number(process.env.SHARD || 0);
const TOTAL = Number(process.env.TOTAL || 100);
const CONCURRENCY = Number(process.env.CONCURRENCY || 10);
const TIMEOUT_MS = Number(process.env.TIMEOUT_MS || 12_000);
const REPORT_FILE = process.env.REPORT_FILE || `distributed-${MODE}-${SHARD}.json`;
const BREVET_PATH = "/api/result-number/upload--brevet_2026";

const round = (value, digits = 2) => Math.round(value * (10 ** digits)) / (10 ** digits);
function percentile(sorted, p) {
  if (!sorted.length) return 0;
  const point = (p / 100) * (sorted.length - 1);
  const low = Math.floor(point);
  const high = Math.ceil(point);
  return low === high ? sorted[low] : sorted[low] + (sorted[high] - sorted[low]) * (point - low);
}

async function request(path, validate, attempts = 1) {
  let last;
  for (let attempt = 1; attempt <= attempts; attempt += 1) {
    const started = performance.now();
    try {
      const response = await fetch(`${BASE_URL}${path}`, {
        redirect: "follow",
        signal: AbortSignal.timeout(TIMEOUT_MS),
        headers: {
          Accept: "application/json,text/plain,*/*",
          "Accept-Language": "ar-MR,ar;q=0.9,fr;q=0.7",
          "User-Agent": "Mozilla/5.0 (Linux; Android 16; Mobile) AppleWebKit/537.36 Chrome/142.0.0.0 Mobile Safari/537.36",
        },
      });
      const body = await response.text();
      let data = null;
      try { data = body ? JSON.parse(body) : null; } catch {}
      const durationMs = performance.now() - started;
      const valid = validate({ response, data, body });
      last = {
        status: response.status,
        durationMs,
        cache: response.headers.get("x-vercel-cache") || response.headers.get("cache-status") || "none",
        valid,
        error: valid ? null : `status=${response.status}, body=${body.slice(0, 160)}`,
      };
    } catch (error) {
      last = {
        status: 0,
        durationMs: performance.now() - started,
        cache: "none",
        valid: false,
        error: error?.name === "TimeoutError" || error?.name === "AbortError" ? "timeout" : String(error?.message || error),
      };
    }
    if (last.valid || attempt === attempts) return last;
    await new Promise((resolve) => setTimeout(resolve, attempt * 300));
  }
  return last;
}

function numberOf(row) {
  return String(row?.["Numéro_C1AS"] ?? row?.["Numéro"] ?? row?.Num_Bepc ?? row?.Numero ?? row?.NODOSS ?? "").trim();
}
const normalized = (value) => String(value || "").replace(/^0+/, "") || "0";

async function functional() {
  const checks = [];
  const check = async (name, path, validate) => checks.push({ name, result: await request(path, validate, 3) });
  await check("brevet", `${BREVET_PATH}/75457`, ({ response, data }) => response.status === 200 && normalized(numberOf(data?.rows?.[0])) === "75457");
  await check("name_disabled", "/api/search?source=upload%3Abrevet_2026&q=Mokhtar", ({ response, data }) => response.status === 400 && data?.rows?.length === 0);
  await check("bac_isolated", "/api/result-number/bac/1", ({ response, data }) => response.status === 200 && normalized(numberOf(data?.rows?.[0])) === "1");
  await check("empty", `${BREVET_PATH}/999999`, ({ response, data }) => response.status === 200 && Array.isArray(data?.rows) && data.rows.length === 0);
  const failed = checks.filter((item) => !item.result.valid);
  const report = { mode: MODE, baseUrl: BASE_URL, checks, passed: failed.length === 0 };
  await writeFile(REPORT_FILE, `${JSON.stringify(report, null, 2)}\n`, "utf8");
  console.log(JSON.stringify(report, null, 2));
  if (failed.length) process.exitCode = 1;
}

function uniqueNumber(index) {
  const seed = SHARD * 100_003 + index + 1;
  return String(1 + ((seed * 7_919 + 173) % 75_694));
}

function summarize(results, elapsedMs) {
  const durations = results.map((item) => item.durationMs).sort((a, b) => a - b);
  const failures = results.filter((item) => !item.valid);
  const statuses = {};
  const caches = {};
  for (const item of results) {
    statuses[item.status] = (statuses[item.status] || 0) + 1;
    caches[item.cache] = (caches[item.cache] || 0) + 1;
  }
  return {
    mode: MODE,
    shard: SHARD,
    baseUrl: BASE_URL,
    total: results.length,
    concurrency: CONCURRENCY,
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
    },
    statuses,
    caches,
    sampleErrors: failures.slice(0, 8).map(({ status, durationMs, error }) => ({ status, durationMs: round(durationMs), error })),
  };
}

async function load() {
  const results = new Array(TOTAL);
  let cursor = 0;
  const started = performance.now();
  async function worker() {
    while (true) {
      const index = cursor++;
      if (index >= TOTAL) return;
      const number = MODE === "cached" ? "75457" : uniqueNumber(index);
      results[index] = await request(`${BREVET_PATH}/${number}`, ({ response, data }) =>
        response.status === 200
        && response.headers.get("x-mauri-search") === "NUMBER-LOOKUP"
        && Array.isArray(data?.rows));
    }
  }
  await Promise.all(Array.from({ length: Math.min(CONCURRENCY, TOTAL) }, worker));
  const report = summarize(results, performance.now() - started);
  await writeFile(REPORT_FILE, `${JSON.stringify(report, null, 2)}\n`, "utf8");
  console.log(JSON.stringify(report, null, 2));
  if (report.errorRate > 0.02) process.exitCode = 1;
}

if (MODE === "functional") await functional();
else await load();
