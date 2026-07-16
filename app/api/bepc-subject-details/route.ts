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
    (item): item is Record<string, unknown> => Boolean(item && typeof item === "object" && !Array.isArray(item)),
  );
}

function stringValue(value: unknown) {
  return value === null || value === undefined ? "" : String(value).trim();
}

function numberValue(value: unknown) {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  const parsed = Number(String(value ?? "").replace(",", "."));
  return Number.isFinite(parsed) ? parsed : null;
}

async function fetchOfficialDetails(number: string) {
  const response = await fetch(`${DEC_ORIGIN}/_api/details-bepc/${encodeURIComponent(number)}`, {
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

  return { ok: response.ok, status: response.status, data };
}

function normalizeSubject(row: Record<string, unknown>) {
  const score = numberValue(row.note ?? row.noteMatiere ?? row.noteRetenue);
  const coefficient = numberValue(row.coef ?? row.coeficient ?? row.coefficient);
  const nameAr = stringValue(row.lmata ?? row.nomMatiereA ?? row.matiereAr ?? row.matiere);
  const nameFr = stringValue(row.lmatf ?? row.nomMatiereF ?? row.matiere);

  return {
    nameAr,
    nameFr,
    score,
    coefficient,
    observation: stringValue(row.observation),
  };
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
    const officialResponse = await fetchOfficialDetails(number);
    const officialCandidate = safeObject(officialResponse.data);

    if (officialResponse.status === 404 || !officialCandidate) {
      return NextResponse.json(
        { ok: false, code: "NOT_FOUND", message: "لم يتم العثور على مترشح بهذا الرقم في منصة الوزارة." },
        { status: 404, headers: { "Cache-Control": "public, s-maxage=60, stale-while-revalidate=120" } },
      );
    }

    if (!officialResponse.ok) {
      return NextResponse.json(
        { ok: false, code: "DEC_UNAVAILABLE", message: "خدمة الوزارة غير متاحة مؤقتًا. حاول بعد قليل." },
        { status: 502, headers: { "Cache-Control": "no-store" } },
      );
    }

    const rawSubjects = safeArray(
      officialCandidate.notes || officialCandidate.details || officialCandidate.subjects || officialCandidate.content,
    );
    const subjects = rawSubjects
      .map(normalizeSubject)
      .filter((subject) => subject.nameAr || subject.nameFr || subject.score !== null);

    const candidate = {
      number: stringValue(officialCandidate.numDossier ?? officialCandidate.numero ?? number),
      nameAr: stringValue(officialCandidate.nomAr ?? officialCandidate.nameAr ?? officialCandidate.nomFr),
      nameFr: stringValue(officialCandidate.nomFr ?? officialCandidate.nameFr ?? officialCandidate.nomAr),
      birthPlaceAr: stringValue(officialCandidate.lieuNaissAr),
      birthPlaceFr: stringValue(officialCandidate.lieuNaissFr),
      birthDate: stringValue(officialCandidate.dateNaiss),
      centreAr: stringValue(officialCandidate.centreExamen ?? officialCandidate.centreAr),
      centreFr: stringValue(officialCandidate.centreFr ?? officialCandidate.centreExamen),
      series: stringValue(officialCandidate.serie),
      average: numberValue(officialCandidate.moyenne),
      decision: stringValue(officialCandidate.decision),
    };

    return NextResponse.json(
      {
        ok: true,
        source: "dec.education.gov.mr",
        sourceUrl: `${DEC_ORIGIN}/search-bepc`,
        candidate,
        subjects,
        detailsAvailable: subjects.length > 0,
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
        message: timedOut
          ? "استغرقت منصة الوزارة وقتًا طويلًا في الرد. أعد المحاولة."
          : "تعذر الاتصال بمنصة الوزارة مؤقتًا.",
      },
      { status: 502, headers: { "Cache-Control": "no-store" } },
    );
  }
}
