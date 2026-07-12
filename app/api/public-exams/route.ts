import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
const SUPABASE_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;
const PUBLIC_CACHE = "public, s-maxage=60, stale-while-revalidate=3600";

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

async function fetchPublishedExams() {
  if (!SUPABASE_URL || !SUPABASE_KEY) {
    return { rows: [], error: "Missing Supabase environment variables", status: 500 } as const;
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
  if (!response.ok) return { rows: [], error: text, status: response.status } as const;

  const rows = (text ? JSON.parse(text) : [])
    .filter((exam: Record<string, unknown>) => /^[A-Za-z_][A-Za-z0-9_]{1,62}$/.test(String(exam.table_name || "").trim()))
    .map(cleanExam)
    .sort((a: Record<string, unknown>, b: Record<string, unknown>) => {
      const byYear = yearNumber(b.year) - yearNumber(a.year);
      if (byYear) return byYear;
      return String(b.created_at || "").localeCompare(String(a.created_at || ""));
    });

  return { rows, status: 200 } as const;
}

export async function GET() {
  const result = await fetchPublishedExams();
  if ("error" in result && result.error) {
    return NextResponse.json(
      { exams: [] },
      { status: 200, headers: { "Cache-Control": "no-store" } }
    );
  }

  return NextResponse.json(
    { exams: result.rows },
    { headers: { "Cache-Control": PUBLIC_CACHE } }
  );
}
