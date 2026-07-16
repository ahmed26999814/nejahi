import { NextResponse } from "next/server";
import { LEGACY_2025_EXAMS } from "../../../lib/legacyExamCatalog";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
const SUPABASE_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;
const PUBLIC_CACHE = "no-store";

function isAdminPlaceholder(value: unknown) {
  const text = String(value || "").trim().toLowerCase();
  return Boolean(text) && (
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

function cleanExam(exam: Record<string, unknown>): Record<string, unknown> {
  const descriptionAr = String(exam.description_ar || "").trim();
  const descriptionFr = String(exam.description_fr || "").trim();
  const uploaded = String(exam.source_key || "").startsWith("upload:");
  return {
    ...exam,
    description_ar: uploaded && (!descriptionAr || isAdminPlaceholder(descriptionAr) || descriptionAr === "\u200B") ? generatedDescription(exam, "ar") : descriptionAr,
    description_fr: uploaded && (!descriptionFr || isAdminPlaceholder(descriptionFr) || descriptionFr === "\u200B") ? generatedDescription(exam, "fr") : descriptionFr,
    tone: String(exam.tone || "").trim() && exam.tone !== "green" ? exam.tone : generatedTone(exam),
  };
}

function sortExams(rows: ReadonlyArray<Record<string, unknown>>) {
  const sourcePriority = ["bac_2026", "brevet_2026", "concours_2026", "bac", "brevet", "concours", "excellence_1as", "bac_session"];
  return [...rows].sort((a, b) => {
    const byYear = yearNumber(b.year) - yearNumber(a.year);
    if (byYear) return byYear;
    const aPriority = sourcePriority.indexOf(String(a.source_key || ""));
    const bPriority = sourcePriority.indexOf(String(b.source_key || ""));
    if (aPriority !== bPriority && (aPriority >= 0 || bPriority >= 0)) return (aPriority < 0 ? 999 : aPriority) - (bPriority < 0 ? 999 : bPriority);
    return String(b.created_at || "").localeCompare(String(a.created_at || ""));
  });
}

async function fetchPublishedExams(): Promise<{ rows: Array<Record<string, unknown>>; error?: string }> {
  if (!SUPABASE_URL || !SUPABASE_KEY) return { rows: [], error: "Missing Supabase environment variables" };
  const url = new URL(`${SUPABASE_URL}/rest/v1/published_exams`);
  url.searchParams.set("select", "source_key,table_name,title_ar,title_fr,description_ar,description_fr,year,tone,search_mode,number_column,name_column,score_column,decision_column,track_column,wilaya_column,moughataa_column,school_column,centre_column,birth_place_column,birth_date_column,ranked_view,total_rows,created_at");
  url.searchParams.set("is_active", "eq.true");
  url.searchParams.set("limit", "100");
  const response = await fetch(url, {
    headers: { apikey: SUPABASE_KEY, Authorization: `Bearer ${SUPABASE_KEY}`, Accept: "application/json", Prefer: "count=none" },
    cache: "no-store",
  });
  const text = await response.text();
  if (!response.ok) return { rows: [], error: text };
  const rows = (text ? JSON.parse(text) : [])
    .filter((exam: Record<string, unknown>) => /^[A-Za-z_][A-Za-z0-9_]{1,62}$/.test(String(exam.table_name || "").trim()))
    .map(cleanExam);
  return { rows: sortExams(rows) };
}

function publicCatalog(uploadedRows: ReadonlyArray<Record<string, unknown>>) {
  const bySourceAndYear = new Map<string, Record<string, unknown>>();
  for (const exam of LEGACY_2025_EXAMS.map(cleanExam)) {
    bySourceAndYear.set(`${String(exam.source_key)}:${String(exam.year || "2025")}`, exam);
  }
  for (const exam of uploadedRows) {
    bySourceAndYear.set(`${String(exam.source_key)}:${String(exam.year || yearNumber(exam.title_ar) || yearNumber(exam.title_fr) || "")}`, exam);
  }
  return sortExams([...bySourceAndYear.values()]);
}

export async function GET() {
  const result = await fetchPublishedExams();
  const exams = publicCatalog(result.rows);
  return NextResponse.json({ exams }, { status: 200, headers: { "Cache-Control": PUBLIC_CACHE, "CDN-Cache-Control": PUBLIC_CACHE, Vary: "Accept-Encoding" } });
}
