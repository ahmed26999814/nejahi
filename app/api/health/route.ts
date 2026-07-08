import { NextResponse } from "next/server";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY;
const REQUEST_TIMEOUT_MS = 8_000;

const CHECKS = [
  { key: "bac", label: "Bac", view: "bac_ranked_results", select: "Numero,rank" },
  { key: "brevet", label: "Brevet", view: "brevet_ranked_results", select: "Num_Bepc,rank" },
  { key: "concours", label: "Concours", view: "concours_ranked_results", select: '"Numéro_C1AS",rank' },
  { key: "bac_session", label: "Bac session 2", view: "bac_session2_ranked_results", select: "NODOSS,rank" },
  { key: "excellence_1as", label: "Excellence 1AS", view: "excellence_1as_ranked_results", select: "Num_Excellence_1AS,rank" },
];

type CheckResult = {
  key: string;
  label: string;
  view: string;
  ok: boolean;
  status?: number;
  sampleCount?: number;
  elapsedMs: number;
  error?: string;
};

function shortError(text: string) {
  return text.replace(/\s+/g, " ").slice(0, 260);
}

async function checkView(check: (typeof CHECKS)[number]): Promise<CheckResult> {
  const started = Date.now();

  if (!SUPABASE_URL || !SUPABASE_KEY) {
    return {
      key: check.key,
      label: check.label,
      view: check.view,
      ok: false,
      elapsedMs: Date.now() - started,
      error: "Missing Supabase environment variables",
    };
  }

  const url = new URL(`${SUPABASE_URL}/rest/v1/${check.view}`);
  url.searchParams.set("select", check.select);
  url.searchParams.set("limit", "1");

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

  try {
    const response = await fetch(url, {
      signal: controller.signal,
      headers: {
        apikey: SUPABASE_KEY,
        Authorization: `Bearer ${SUPABASE_KEY}`,
        Accept: "application/json",
        Prefer: "count=none",
      },
    });
    const text = await response.text();
    const elapsedMs = Date.now() - started;

    if (!response.ok) {
      return {
        key: check.key,
        label: check.label,
        view: check.view,
        ok: false,
        status: response.status,
        elapsedMs,
        error: shortError(text),
      };
    }

    const rows = text ? JSON.parse(text) : [];
    return {
      key: check.key,
      label: check.label,
      view: check.view,
      ok: true,
      status: response.status,
      sampleCount: Array.isArray(rows) ? rows.length : 0,
      elapsedMs,
    };
  } catch (error) {
    return {
      key: check.key,
      label: check.label,
      view: check.view,
      ok: false,
      elapsedMs: Date.now() - started,
      error: error instanceof Error && error.name === "AbortError" ? "Health check timeout" : String(error),
    };
  } finally {
    clearTimeout(timeout);
  }
}

export async function GET() {
  const started = Date.now();
  const checks = await Promise.all(CHECKS.map(checkView));
  const ok = Boolean(SUPABASE_URL && SUPABASE_KEY) && checks.every((check) => check.ok);

  return NextResponse.json(
    {
      ok,
      service: "MauriResults",
      checkedAt: new Date().toISOString(),
      elapsedMs: Date.now() - started,
      env: {
        hasSupabaseUrl: Boolean(SUPABASE_URL),
        hasSupabaseKey: Boolean(SUPABASE_KEY),
      },
      checks,
      nextStep: ok
        ? "All fast ranked views are available. Search and ranking APIs are ready."
        : "Run the ranked views SQL migration in Supabase, then refresh /api/health.",
    },
    {
      status: ok ? 200 : 503,
      headers: { "Cache-Control": "no-store" },
    }
  );
}
