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

function stringValue(value: unknown) {
  return value === null || value === undefined ? "" : String(value).trim();
}

function numberValue(value: unknown) {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  const parsed = Number(String(value ?? "").replace(",", "."));
  return Number.isFinite(parsed) ? parsed : null;
}

async function fetchOfficialDetails(number: string) {
  const response = await fetch(
    `${DEC_ORIGIN}/_api/details-bac/${encodeURIComponent(number)}`,
    {
      headers: {
        accept: "application/json, text/plain, */*",
        "accept-language": "ar,fr;q=0.9,en;q=0.8",
        referer: `${DEC_ORIGIN}/list-bac`,
        "user-agent": "MauriResults/3.3 (+https://mauri-results.vercel.app)",
      },
      next: { revalidate: 300 },
      signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
    },
  );

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
  const rawScore = numberValue(
    row.note ??
      row.noteMatiere ??
      row.noteRetenue ??
      row.noteFinale ??
      row.score ??
      row.moyenne,
  );
  const notCounted = rawScore !== null && rawScore < 0;
  const coefficient = numberValue(
    row.coef ?? row.coeficient ?? row.coefficient ?? row.coeff,
  );
  const nameAr = stringValue(
    row.lmata ??
      row.nomMatiereA ??
      row.matiereAr ??
      row.libelleAr ??
      row.matiere ??
      row.nomMatiere,
  );
  const nameFr = stringValue(
    row.lmatf ??
      row.nomMatiereF ??
      row.matiereFr ??
      row.libelleFr ??
      row.matiere ??
      row.nomMatiere,
  );

  return {
    nameAr,
    nameFr,
    score: notCounted ? null : rawScore,
    coefficient,
    notCounted,
    observation: stringValue(row.observation ?? row.decision),
  };
}

function nestedSubjectRows(candidate: Record<string, unknown>) {
  const candidates = [
    candidate.notes,
    candidate.details,
    candidate.subjects,
    candidate.content,
    candidate.matieres,
    candidate.marks,
  ];

  for (const value of candidates) {
    const rows = safeArray(value);
    if (rows.length) return rows;
  }

  return [];
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
    const directRows = safeArray(officialResponse.data);
    const officialCandidate =
      safeObject(officialResponse.data) || directRows[0] || null;

    if (officialResponse.status === 404 || !officialCandidate) {
      return NextResponse.json(
        {
          ok: false,
          code: "NOT_FOUND",
          message: "لم يتم العثور على درجات مواد لهذا المترشح في منصة الوزارة.",
        },
        {
          status: 404,
          headers: {
            "Cache-Control": "public, s-maxage=60, stale-while-revalidate=120",
          },
        },
      );
    }

    if (!officialResponse.ok) {
      return NextResponse.json(
        {
          ok: false,
          code: "DEC_UNAVAILABLE",
          message: "خدمة الوزارة غير متاحة مؤقتًا. حاول بعد قليل.",
        },
        { status: 502, headers: { "Cache-Control": "no-store" } },
      );
    }

    const rawSubjects = directRows.length
      ? directRows
      : nestedSubjectRows(officialCandidate);
    const subjects = rawSubjects
      .map(normalizeSubject)
      .filter(
        (subject) =>
          subject.nameAr ||
          subject.nameFr ||
          subject.score !== null ||
          subject.notCounted,
      );

    const candidate = {
      number: stringValue(
        officialCandidate.numDossier ??
          officialCandidate.numeroDossier ??
          officialCandidate.numero ??
          number,
      ),
      nameAr: stringValue(
        officialCandidate.nomAr ??
          officialCandidate.nameAr ??
          officialCandidate.nomFr,
      ),
      nameFr: stringValue(
        officialCandidate.nomFr ??
          officialCandidate.nameFr ??
          officialCandidate.nomAr,
      ),
      centreAr: stringValue(
        officialCandidate.centreExamen ??
          officialCandidate.centreAr ??
          officialCandidate.etablissement,
      ),
      centreFr: stringValue(
        officialCandidate.centreFr ??
          officialCandidate.centreExamen ??
          officialCandidate.etablissement,
      ),
      series: stringValue(
        officialCandidate.serie ?? officialCandidate.series ?? officialCandidate.TS,
      ),
      average: numberValue(
        officialCandidate.moyenne ??
          officialCandidate.MOD ??
          officialCandidate.average,
      ),
      decision: stringValue(
        officialCandidate.decision ??
          officialCandidate.resultat ??
          officialCandidate.KR,
      ),
    };

    return NextResponse.json(
      {
        ok: true,
        source: "dec.education.gov.mr",
        sourceUrl: `${DEC_ORIGIN}/list-bac`,
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
