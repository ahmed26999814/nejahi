import { writeFile } from "node:fs/promises";

const BASE_URL = (process.env.BASE_URL || "https://deploy-preview-19--mauri-results.netlify.app").replace(/\/$/, "");
const output = {
  baseUrl: BASE_URL,
  startedAt: new Date().toISOString(),
  attempts: [],
  endpoints: [],
};

async function inspect(path) {
  const started = Date.now();
  try {
    const response = await fetch(`${BASE_URL}${path}`, {
      redirect: "follow",
      headers: {
        Accept: "application/json",
        "User-Agent": "MauriResults-Preview-Diagnostic/1.0",
      },
      signal: AbortSignal.timeout(10_000),
    });
    const body = await response.text();
    return {
      path,
      status: response.status,
      durationMs: Date.now() - started,
      headers: Object.fromEntries(
        [...response.headers.entries()].filter(([key]) =>
          ["content-type", "cache-control", "x-mauri-search", "server", "cache-status", "x-nf-request-id"].includes(key),
        ),
      ),
      body: body.slice(0, 2_000),
    };
  } catch (error) {
    return {
      path,
      status: 0,
      durationMs: Date.now() - started,
      error: error?.name === "AbortError" ? "timeout" : String(error?.message || error),
    };
  }
}

for (let attempt = 1; attempt <= 36; attempt += 1) {
  const result = await inspect("/api/search?source=upload%3Abrevet_2026&q=75457");
  output.attempts.push({ attempt, ...result });
  if (result.status === 200 && result.headers?.["x-mauri-search"] === "NUMBER-LOOKUP") break;
  await new Promise((resolve) => setTimeout(resolve, 10_000));
}

const paths = [
  "/api/search?source=upload%3Abrevet_2026&q=75457",
  "/api/search?source=upload%3Abrevet_2026&q=00075457",
  `/api/search?source=upload%3Abrevet_2026&q=${encodeURIComponent("٧٥٤٥٧")}`,
  "/api/search?source=upload%3Abrevet_2026&q=Mokhtar",
  "/api/forgot-number?source=brevet&name=Mokhtar",
  "/api/search?source=bac&q=00001",
  `/api/uploaded-concours-search?${new URLSearchParams({
    source: "upload:concour_2026",
    wilaya: "داخلت انواديـبـو",
    moughataa: "انواذيب",
    centre: "شنقيط 1",
    number: "106",
  })}`,
];

for (const path of paths) output.endpoints.push(await inspect(path));
output.endedAt = new Date().toISOString();

await writeFile("preview-search-diagnostic.json", `${JSON.stringify(output, null, 2)}\n`, "utf8");
console.log(JSON.stringify(output, null, 2));
