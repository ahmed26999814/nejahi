import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const DEC_ORIGIN = "https://dec.education.gov.mr";
const REQUEST_TIMEOUT_MS = 12_000;

function normalizeCandidateNumber(value: string | null) {
  return String(value || "").trim().replace(/[٠-٩]/g, (digit) => String("٠١٢٣٤٥٦٧٨٩".indexOf(digit))).replace(/\D/g, "");
}

function safeObject(value: unknown): Record<string, unknown> | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  return value as Record<string, unknown>;
}

function safeArray(value: unknown): Record<string, unknown>[] {
  if (!Array.isArray(value)) return [];
  return value.filter((item): item is Record<string, unknown> => Boolean(item && typeof item === "object" && !Array.isArray(item)));
}

async function decJson(path: string) {
  const response = await fetch(`${DEC_ORIGIN}${path}`, {
    headers: {
      accept: "application/json, text/plain, */*",
      "accept-language": "ar,fr;q=0.9,en;q=0.8",
      referer: `${DEC_ORIGIN}/search-bepc`,
      "user-agent": "MauriResults/2.1 (+https://mauri-results.vercel.app)",
    },
    next: { revalidate: 300 },
    signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
  });

  const text = await response.text();
  let data: unknown = null;
  try {
    data = text ? JSON.parse(text) : null;
  } catch {
    data = null;
  }

  return { ok: response.ok, status: response.status, data, text };
}

function uniqueIdentifiers(candidate: Record<string, unknown>, fallback: string) {
  const values = [candidate.numDossier, candidate.numero, candidate.nni, candidate.id, fallback]
    .map((value) => String(value ?? "").trim())
    .filter(Boolean);
  return Array.from(new Set(values));
}

export async function GET(request: NextRequest) {
  const number = normalizeCandidateNumber(request.nextUrl.searchParams.get("number"));

  if (!number || number.length > 14) {
    return NextResponse.json(
      { ok: false, code: "INVALID_NUMBER", message: "أدخل رقم مترشح صحيحًا." },
      { status: 400, headers: { "Cache-Control": "no-store" } },
    );
  }

  try {
    const candidateResponse = await decJson(`/_api/bepc/search/${encodeURIComponent(number)}`);

    if (candidateResponse.status === 404 || !candidateResponse.data) {
      return NextResponse.json(
        { ok: false, code: "NOT_FOUND", message: "لم يتم العثور على مترشح بهذا الرقم في منصة الوزارة." },
        { status: 404, headers: { "Cache-Control": "public, s-maxage=60, stale-while-revalidate=120" } },
      );
    }

    if (!candidateResponse.ok) {
      return NextResponse.json(
        { ok: false, code: "DEC_UNAVAILABLE", message: "خدمة الوزارة غير متاحة مؤقتًا. حاول بعد قليل." },
        { status: 502, headers: { "Cache-Control": "no-store" } },
      );
    }

    const candidate = safeObject(candidateResponse.data) || safeArray(candidateResponse.data)[0] || null;
    if (!candidate) {
      return NextResponse.json(
        { ok: false, code: "NOT_FOUND", message: "لم يتم العثور على بيانات مترشح مطابقة." },
        { status: 404, headers: { "Cache-Control": "public, s-maxage=60, stale-while-revalidate=120" } },
      );
    }

    let subjects: Record<string, unknown>[] = [];
    let detailsStatus = 404;

    for (const identifier of uniqueIdentifiers(candidate, number)) {
      const detailsResponse = await decJson(`/_api/details-bepc/${encodeURIComponent(identifier)}`);
      detailsStatus = detailsResponse.status;
      const rows = safeArray(detailsResponse.data);
      if (rows.length) {
        subjects = rows;
        break;
      }
      const detailsObject = safeObject(detailsResponse.data);
      if (detailsObject) {
        const nested = safeArray(detailsObject.content || detailsObject.details || detailsObject.notes || detailsObject.subjects);
        if (nested.length) {
          subjects = nested;
          break;
        }
      }
    }

    return NextResponse.json(
      {
        ok: true,
        source: "dec.education.gov.mr",
        candidate,
        subjects,
        detailsAvailable: subjects.length > 0,
        detailsStatus,
      },
      {
        headers: {
          "Cache-Control": "public, s-maxage=300, stale-while-revalidate=900",
          "X-Content-Type-Options": "nosniff",
        },
      },
    );
  } catch (error) {
    const timedOut = error instanceof Error && (error.name === "TimeoutError" || error.name === "AbortError");
    return NextResponse.json(
      {
        ok: false,
        code: timedOut ? "TIMEOUT" : "UPSTREAM_ERROR",
        message: timedOut ? "استغرقت منصة الوزارة وقتًا طويلًا في الرد. أعد المحاولة." : "تعذر الاتصال بمنصة الوزارة مؤقتًا.",
      },
      { status: 502, headers: { "Cache-Control": "no-store" } },
    );
  }
}
