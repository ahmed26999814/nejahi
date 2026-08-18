import { unstable_cache } from "next/cache";
import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const REQUEST_TIMEOUT_MS = 4_000;
const CATALOG_CACHE = "public, max-age=300, s-maxage=1800, stale-while-revalidate=86400, stale-if-error=86400";

function clean(value: unknown, maxLength = 160) {
  return String(value ?? "").replace(/\u0000/g, "").trim().slice(0, maxLength);
}

async function rpc(name: string, body: Record<string, unknown>) {
  if (!SUPABASE_URL || !SUPABASE_KEY) throw new Error("Missing Supabase variables");

  const response = await fetch(`${SUPABASE_URL}/rest/v1/rpc/${name}`, {
    method: "POST",
    cache: "no-store",
    signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
    headers: {
      apikey: SUPABASE_KEY,
      Authorization: `Bearer ${SUPABASE_KEY}`,
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    body: JSON.stringify(body),
  });

  const text = await response.text();
  if (!response.ok) throw new Error(text.slice(0, 700));
  return text ? JSON.parse(text) : [];
}

const getCachedCatalog = unstable_cache(
  () => rpc("get_public_competition_catalog", {}),
  ["mauriresults-public-competition-catalog-v1"],
  { revalidate: 1800 },
);

function noStoreHeaders() {
  return {
    "Cache-Control": "private, no-store, max-age=0",
    "CDN-Cache-Control": "no-store",
    "Vercel-CDN-Cache-Control": "no-store",
  };
}

export async function GET() {
  if (!SUPABASE_URL || !SUPABASE_KEY) {
    return NextResponse.json({ competitions: [], error: "الخدمة غير متاحة حاليًا" }, { status: 503 });
  }

  try {
    const rows = await getCachedCatalog();
    return NextResponse.json(
      { competitions: Array.isArray(rows) ? rows : [] },
      {
        headers: {
          "Cache-Control": CATALOG_CACHE,
          "CDN-Cache-Control": CATALOG_CACHE,
          "Vercel-CDN-Cache-Control": CATALOG_CACHE,
          Vary: "Accept-Encoding",
        },
      },
    );
  } catch (error) {
    const timedOut = error instanceof Error && (error.name === "TimeoutError" || error.name === "AbortError");
    return NextResponse.json(
      { competitions: [], error: "تعذر تحميل المسابقات حاليًا" },
      { status: timedOut ? 504 : 503, headers: noStoreHeaders() },
    );
  }
}

export async function POST(request: Request) {
  if (!SUPABASE_URL || !SUPABASE_KEY) {
    return NextResponse.json({ results: [], error: "الخدمة غير متاحة حاليًا" }, { status: 503, headers: noStoreHeaders() });
  }

  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ results: [], error: "طلب غير صالح" }, { status: 400, headers: noStoreHeaders() });
  }

  const competition = clean(body.competition, 100);
  const track = clean(body.track, 40);
  const mode = clean(body.mode, 20) === "receipt" ? "receipt" : "name";
  const action = clean(body.action, 20) === "suggest" ? "suggest" : "search";
  const query = clean(body.query, mode === "receipt" ? 40 : 120);

  if (!competition || !query) {
    return NextResponse.json({ results: [], error: "أدخل بيانات البحث" }, { status: 400, headers: noStoreHeaders() });
  }

  if (mode === "name" && query.length < 3) {
    return NextResponse.json({ results: [], error: "أدخل ثلاثة أحرف على الأقل من الاسم" }, { status: 400, headers: noStoreHeaders() });
  }

  if (mode === "receipt" && !/^\d{1,40}$/.test(query.replace(/\s+/g, ""))) {
    return NextResponse.json({ results: [], error: "أدخل رقم وصل صحيحًا" }, { status: 400, headers: noStoreHeaders() });
  }

  try {
    const rows = await rpc("search_public_competition_candidatures", {
      p_competition_slug: competition,
      p_query: query,
      p_mode: mode,
      p_track_code: track || null,
      p_limit: action === "suggest" ? 6 : 25,
    });

    return NextResponse.json(
      { results: Array.isArray(rows) ? rows : [] },
      { headers: noStoreHeaders() },
    );
  } catch (error) {
    const timedOut = error instanceof Error && (error.name === "TimeoutError" || error.name === "AbortError");
    return NextResponse.json(
      { results: [], error: timedOut ? "استغرق البحث وقتًا أطول من المعتاد، حاول مجددًا" : "تعذر إكمال البحث حاليًا" },
      { status: timedOut ? 504 : 503, headers: { ...noStoreHeaders(), "Retry-After": "2" } },
    );
  }
}
