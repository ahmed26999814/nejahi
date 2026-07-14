import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
const SUPABASE_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;
const PUBLIC_CACHE = "public, s-maxage=60, stale-while-revalidate=3600";

const LEGACY_2025_EXAMS = [
  {
    source_key: "bac",
    table_name: "bac_results",
    title_ar: "نتائج باكالوريا 2025",
    title_fr: "Résultats Bac 2025",
    description_ar: "النتائج الرسمية للباكالوريا لسنة 2025.",
    description_fr: "Résultats officiels du baccalauréat 2025.",
    year: "2025",
    tone: "green",
    search_mode: "simple",
    number_column: "Numero",
    name_column: "NOM",
    score_column: "MOD",
    decision_column: "KR",
    track_column: "TS",
    wilaya_column: "WL",
    moughataa_column: "",
    school_column: "MS",
    centre_column: "MD",
    birth_place_column: "",
    birth_date_column: "",
    ranked_view: "bac_ranked_results",
    total_rows: null,
    created_at: "2025-07-01T00:00:00.000Z",
  },
  {
    source_key: "brevet",
    table_name: "brevet_results",
    title_ar: "نتائج أبريفه 2025",
    title_fr: "Résultats BEPC 2025",
    description_ar: "نتائج شهادة ختم الدروس الإعدادية الرسمية لسنة 2025.",
    description_fr: "Résultats officiels du BEPC 2025.",
    year: "2025",
    tone: "blue",
    search_mode: "simple",
    number_column: "Num_Bepc",
    name_column: "NOM",
    score_column: "Moyenne_Bepc",
    decision_column: "Decision",
    track_column: null,
    wilaya_column: "WILAYA",
    moughataa_column: "",
    school_column: "Ecole",
    centre_column: "Centre",
    birth_place_column: "LIEU_NAIS",
    birth_date_column: "DATE_NAISS",
    ranked_view: "brevet_ranked_results",
    total_rows: null,
    created_at: "2025-07-01T00:00:00.000Z",
  },
  {
    source_key: "concours",
    table_name: "concours_results_view",
    title_ar: "نتائج كونكور 2025",
    title_fr: "Résultats Concours 2025",
    description_ar: "ابحث بالولاية والمقاطعة والمركز ورقم المترشح لسنة 2025.",
    description_fr: "Recherche par région, département, centre et numéro 2025.",
    year: "2025",
    tone: "gold",
    search_mode: "concours",
    number_column: "NODOSS",
    name_column: "NOM_AR",
    score_column: "total_num",
    decision_column: "TYPE",
    track_column: null,
    wilaya_column: "WILAYA_AR",
    moughataa_column: "MOUGHATAA_AR",
    school_column: "Ecole_AR",
    centre_column: "Centre Examen_AR",
    birth_place_column: "LIEU NAISS_AR",
    birth_date_column: "ANNEE_NAISS",
    ranked_view: "concours_ranked_results",
    total_rows: null,
    created_at: "2025-07-01T00:00:00.000Z",
  },
  {
    source_key: "excellence_1as",
    table_name: "excellence_1as_results",
    title_ar: "نتائج الامتياز الأولى إعدادية 2025",
    title_fr: "Résultats Excellence 1AS 2025",
    description_ar: "نتائج مسابقة الامتياز الأولى إعدادية لسنة 2025.",
    description_fr: "Résultats du concours Excellence 1AS 2025.",
    year: "2025",
    tone: "teal",
    search_mode: "simple",
    number_column: "Num_Excellence_1AS",
    name_column: "Nom",
    score_column: "Mgex",
    decision_column: "Decision",
    track_column: "SERIE",
    wilaya_column: "Wilaya_AR",
    moughataa_column: "",
    school_column: "",
    centre_column: "CENTRE_AR",
    birth_place_column: "Lieu",
    birth_date_column: "DATEN",
    ranked_view: "excellence_1as_ranked_results",
    total_rows: null,
    created_at: "2025-07-01T00:00:00.000Z",
  },
  {
    source_key: "bac_session",
    table_name: "bac_session2_results",
    title_ar: "نتائج باكالوريا الدورة التكميلية 2025",
    title_fr: "Résultats Bac session complémentaire 2025",
    description_ar: "نتائج الدورة التكميلية للباكالوريا لسنة 2025.",
    description_fr: "Résultats de la session complémentaire du Bac 2025.",
    year: "2025",
    tone: "amber",
    search_mode: "simple",
    number_column: "NODOSS",
    name_column: "NOM_AR",
    score_column: "Moy Bac_Session",
    decision_column: "Decision",
    track_column: "SERIE",
    wilaya_column: "Wilaya_AR",
    moughataa_column: "",
    school_column: "Etablissement_AR",
    centre_column: "Centre Examen_AR",
    birth_place_column: "LIEUNN_AR",
    birth_date_column: "DATN",
    ranked_view: "bac_session2_ranked_results",
    total_rows: null,
    created_at: "2025-07-01T00:00:00.000Z",
  },
];

function isAdminPlaceholder(value: unknown) {
  const text = String(value || "").trim().toLowerCase();
  if (!text) return false;
  return (
    (text.includes("منشورة") && (text.includes("الأدمن") || text.includes("الادمن") || text.includes("admin"))) ||
    (text.includes("publi") && text.includes("administr"))
  );
}

function yearNumber(value: unknown) {
  const matched = String(value || "").match(/20\d{2}/)?.[0];
  return matched ? Number(matched) : 0;
}

function examKind(exam: Record<string, unknown>) {
  const identity = `${exam.table_name || ""} ${exam.title_ar || ""} ${exam.title_fr || ""}`.toLowerCase();
  if (/concours|c1as|كونكور|دخول السنة الأولى/.test(identity)) return "concours";
  if (/bepc|brevet|بريف|أبريفه|ابريفه/.test(identity)) return "brevet";
  if (/excellence|امتياز/.test(identity)) return "excellence";
  if (/session|complémentaire|complementaire|تكميلية|sc/.test(identity)) return "session";
  if (/bac|baccalaureat|baccalauréat|باكالوريا/.test(identity)) return "bac";
  return "results";
}

function generatedDescription(exam: Record<string, unknown>, language: "ar" | "fr") {
  const year = String(exam.year || yearNumber(exam.title_ar) || yearNumber(exam.title_fr) || "").trim();
  const suffixAr = year ? ` لسنة ${year}` : "";
  const suffixFr = year ? ` ${year}` : "";

  const descriptions = {
    ar: {
      concours: `ابحث بالولاية والمقاطعة والمركز ورقم المترشح${suffixAr}.`,
      brevet: `نتائج شهادة ختم الدروس الإعدادية الرسمية${suffixAr}.`,
      excellence: `نتائج مسابقة الامتياز الرسمية${suffixAr}.`,
      session: `نتائج الدورة التكميلية للباكالوريا${suffixAr}.`,
      bac: `النتائج الرسمية للباكالوريا${suffixAr}.`,
      results: `النتائج الرسمية المتاحة للبحث${suffixAr}.`,
    },
    fr: {
      concours: `Recherche par région, département, centre et numéro${suffixFr}.`,
      brevet: `Résultats officiels du BEPC${suffixFr}.`,
      excellence: `Résultats officiels du concours d’excellence${suffixFr}.`,
      session: `Résultats de la session complémentaire du Bac${suffixFr}.`,
      bac: `Résultats officiels du baccalauréat${suffixFr}.`,
      results: `Résultats officiels disponibles${suffixFr}.`,
    },
  };

  return descriptions[language][examKind(exam)];
}

function generatedTone(exam: Record<string, unknown>) {
  const kind = examKind(exam);
  if (kind === "concours") return "gold";
  if (kind === "brevet") return "blue";
  if (kind === "excellence") return "teal";
  if (kind === "session") return "amber";
  if (kind === "bac") return "green";
  return "purple";
}

function cleanExam(exam: Record<string, unknown>) {
  const descriptionAr = String(exam.description_ar || "").trim();
  const descriptionFr = String(exam.description_fr || "").trim();
  const uploaded = String(exam.source_key || "").startsWith("upload:");
  const shouldGenerateAr = !descriptionAr || isAdminPlaceholder(descriptionAr) || descriptionAr === "\u200B";
  const shouldGenerateFr = !descriptionFr || isAdminPlaceholder(descriptionFr) || descriptionFr === "\u200B";

  return {
    ...exam,
    description_ar: uploaded && shouldGenerateAr ? generatedDescription(exam, "ar") : descriptionAr,
    description_fr: uploaded && shouldGenerateFr ? generatedDescription(exam, "fr") : descriptionFr,
    tone: String(exam.tone || "").trim() && exam.tone !== "green" ? exam.tone : generatedTone(exam),
  };
}

function sortExams(rows: Array<Record<string, unknown>>) {
  const sourcePriority = ["bac", "brevet", "concours", "excellence_1as", "bac_session"];
  return [...rows].sort((a, b) => {
    const byYear = yearNumber(b.year) - yearNumber(a.year);
    if (byYear) return byYear;
    const aPriority = sourcePriority.indexOf(String(a.source_key || ""));
    const bPriority = sourcePriority.indexOf(String(b.source_key || ""));
    if (aPriority !== bPriority && (aPriority >= 0 || bPriority >= 0)) {
      return (aPriority < 0 ? 999 : aPriority) - (bPriority < 0 ? 999 : bPriority);
    }
    return String(b.created_at || "").localeCompare(String(a.created_at || ""));
  });
}

async function fetchPublishedExams() {
  if (!SUPABASE_URL || !SUPABASE_KEY) {
    return { rows: sortExams(LEGACY_2025_EXAMS.map(cleanExam)), error: "Missing Supabase environment variables", status: 500 } as const;
  }

  const url = new URL(`${SUPABASE_URL}/rest/v1/published_exams`);
  url.searchParams.set("select", "source_key,table_name,title_ar,title_fr,description_ar,description_fr,year,tone,search_mode,number_column,name_column,score_column,decision_column,track_column,wilaya_column,moughataa_column,school_column,centre_column,birth_place_column,birth_date_column,ranked_view,total_rows,created_at");
  url.searchParams.set("is_active", "eq.true");
  url.searchParams.set("limit", "100");

  const response = await fetch(url, {
    headers: {
      apikey: SUPABASE_KEY,
      Authorization: `Bearer ${SUPABASE_KEY}`,
      Accept: "application/json",
      Prefer: "count=none",
    },
    next: { revalidate: 60 },
  });

  const text = await response.text();
  if (!response.ok) {
    return { rows: sortExams(LEGACY_2025_EXAMS.map(cleanExam)), error: text, status: response.status } as const;
  }

  const uploadedRows = (text ? JSON.parse(text) : [])
    .filter((exam: Record<string, unknown>) => /^[A-Za-z_][A-Za-z0-9_]{1,62}$/.test(String(exam.table_name || "").trim()))
    .map(cleanExam);

  const bySource = new Map<string, Record<string, unknown>>();
  for (const exam of LEGACY_2025_EXAMS.map(cleanExam)) bySource.set(String(exam.source_key), exam);
  for (const exam of uploadedRows) bySource.set(String(exam.source_key), exam);

  return { rows: sortExams([...bySource.values()]), status: 200 } as const;
}

export async function GET() {
  const result = await fetchPublishedExams();
  return NextResponse.json(
    { exams: result.rows },
    { status: 200, headers: { "Cache-Control": "error" in result ? "no-store" : PUBLIC_CACHE } }
  );
}
