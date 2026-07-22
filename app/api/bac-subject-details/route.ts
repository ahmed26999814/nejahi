import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const DEC_ORIGIN = "https://dec.education.gov.mr";
const REQUEST_TIMEOUT_MS = 12_000;

function normalizeCandidateNumber(value: string | null) {
  return String(value || "")
    .trim()
    .replace(/[٠-٩]/g, (digit) => String("٠١٢٣٤٥٦٧٨٩".indexOf(digit)))
    .replace(/\D/g, "");
}

function safeObject(value: unknown): Record<string, unknown> | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  return value as Record<string, unknown>;
}

function safeArray(value: unknown): Record<string, unknown>[] {
  if (!Array.isArray(value)) return [];
  return value.filter(
    (item): item is Record<string, unknown> =>
      Boolean(item && typeof item === "object" && !Array.isArray(item)),
  );
}

function nestedRows(value: unknown) {
  const direct = safeArray(value);
  if (direct.length) return direct;

  const object = safeObject(value);
  if (!object) return [];

  const candidates = [
    object.content,
    object.details,
    object.notes,
    object.subjects,
    object.matieres,
    object.marks,
    object.data,
  ];

  for (const candidate of candidates) {
    const rows = safeArray(candidate);
    if (rows.length) return rows;
  }

  return [];
}

async function decJson(path: string) {
  const response = await fetch(`${DEC_ORIGIN}${path}`, {
    headers: {
      accept: "application/json, text/plain, */*",
      "accept-language": "ar,fr;q=0.9,en;q=0.8",
      referer: `${DEC_ORIGIN}/list-bac`,
      "user-agent": "MauriResults/3.3 (+https://mauri-results.vercel.app)",
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

  return { ok: response.ok, status: response.status, data };
}

function candidateFrom(value: unknown) {
  return safeObject(value) || safeArray(value)[0] || null;
}

function uniqueIdentifiers(candidate: Record<string, unknown>, fallback: string) {
  const values = [
    candidate.numDossier,
    candidate.numeroDossier,
    candidate.numero,
    candidate.Numero,
    candidate.nni,
    candidate.id,
    fallback,
  ]
    .map((value) => String(value ?? "").trim())
    .filter(Boolean);

  return Array.from(new Set(values)).slice(0, 4);
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
    const candidateResponse = await decJson(
      `/_api/bac/search/${encodeURIComponent(number)}`,
    );

    if (!candidateResponse.ok && candidateResponse.status !== 404) {
      return NextResponse.json(
        {
          ok: false,
          code: "DEC_UNAVAILABLE",
          message: "خدمة الوزارة غير متاحة مؤقتًا. حاول بعد قليل.",
        },
        { status: 502, headers: { "Cache-Control": "no-store" } },
      );
    }

    const candidate = candidateFrom(candidateResponse.data) || { numero: number };
    let subjects: Record<string, unknown>[] = [];
    let detailsStatus = 404;

    for (const identifier of uniqueIdentifiers(candidate, number)) {
      const detailsResponse = await decJson(
        `/_api/details-bac/${encodeURIComponent(identifier)}`,
      );
      detailsStatus = detailsResponse.status;
      subjects = nestedRows(detailsResponse.data);
      if (subjects.length) break;
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
    const timedOut =
      error instanceof Error &&
      (error.name === "TimeoutError" || error.name === "AbortError");

    return NextResponse.json(
      {
        ok: false,
        code: timedOut ? "TIMEOUT" : "UPSTREAM_ERROR",
        message: timedOut
          ? "استغرقت منصة الوزارة وقتًا طويلًا في الرد. أعد المحاولة."
          : "تعذر الاتصال بمنصة الوزارة مؤقتًا.",
      },
      { status: 502, headers: { "Cache-Control": "no-store" } },
    );
  }
}
