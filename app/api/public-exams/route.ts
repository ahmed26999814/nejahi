import { unstable_cache } from "next/cache";
import { NextResponse } from "next/server";
import { PUBLIC_EXAMS_CACHE_TAG } from "../../../lib/cacheTags";
import { LEGACY_2025_EXAMS } from "../../../lib/legacyExamCatalog";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const SITE_URL = "https://mauri-results.vercel.app";
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
const SUPABASE_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;
const PUBLIC_CACHE = "public, s-maxage=60, stale-while-revalidate=3600";
const REQUIRED_APP_VERSION = "3.0.0";

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
  if (/bepc|brevet|بريف|ابريفه|البريفيه/.test(identity)) return "brevet";
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
  const kind = examKind(exam);
  return {
    ...exam,
    track_column: kind === "brevet" || kind === "concours" ? null : exam.track_column,
    description_ar: uploaded && (!descriptionAr || isAdminPlaceholder(descriptionAr) || descriptionAr === "\u200B") ? generatedDescription(exam, "ar") : descriptionAr,
    description_fr: uploaded && (!descriptionFr || isAdminPlaceholder(descriptionFr) || descriptionFr === "\u200B") ? generatedDescription(exam, "fr") : descriptionFr,
    tone: String(exam.tone || "").trim() && exam.tone !== "green" ? exam.tone : generatedTone(exam),
  };
}

function sortExams(rows: ReadonlyArray<Record<string, unknown>>) {
  const kindPriority: Record<string, number> = { bac: 0, brevet: 1, concours: 2, excellence: 3, session: 4, results: 5 };
  return [...rows].sort((a, b) => {
    const byYear = yearNumber(b.year) - yearNumber(a.year);
    if (byYear) return byYear;
    const byKind = (kindPriority[examKind(a)] ?? 99) - (kindPriority[examKind(b)] ?? 99);
    if (byKind) return byKind;
    return String(b.created_at || "").localeCompare(String(a.created_at || ""));
  });
}

async function fetchPublishedExamsUncached(): Promise<{ rows: Array<Record<string, unknown>>; error?: string }> {
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

const fetchPublishedExams = unstable_cache(
  fetchPublishedExamsUncached,
  ["mauriresults-public-exams-v4"],
  { revalidate: 60, tags: [PUBLIC_EXAMS_CACHE_TAG] }
);

function publicCatalog(uploadedRows: ReadonlyArray<Record<string, unknown>>) {
  const byIdentity = new Map<string, Record<string, unknown>>();
  const identity = (exam: Record<string, unknown>) => `${String(exam.source_key || "")}:${String(exam.year || yearNumber(exam.title_ar) || "")}`;
  for (const exam of LEGACY_2025_EXAMS.map(cleanExam)) byIdentity.set(identity(exam), exam);
  for (const exam of uploadedRows) byIdentity.set(identity(exam), exam);
  return sortExams([...byIdentity.values()]);
}

function legacyUpdateExam(): Record<string, unknown> {
  return {
    source_key: "update_required_v3",
    table_name: "update_required_v3",
    title_ar: "هذا الإصدار متوقف",
    title_fr: "Cette version est arrêtée",
    description_ar: `نزّل تحديث MauriResults الجديد ${REQUIRED_APP_VERSION} من ${SITE_URL.replace("https://", "")}/Apk للمتابعة.`,
    description_fr: `Téléchargez la nouvelle version MauriResults ${REQUIRED_APP_VERSION} depuis ${SITE_URL.replace("https://", "")}/Apk.`,
    year: "2026",
    tone: "amber",
    search_mode: "number",
    number_column: "Numero",
    name_column: "NOM",
    score_column: "MOD",
    decision_column: "KR",
    track_column: null,
    total_rows: 0,
    created_at: new Date().toISOString(),
  };
}

export async function GET(request: Request) {
  const url = new URL(request.url);
  const client = url.searchParams.get("client");
  const nativeClient = request.headers.get("x-mauriresults-client");
  const legacyMobile = client === "mobile" && nativeClient !== "flutter-native";

  if (legacyMobile) {
    return NextResponse.json(
      {
        exams: [legacyUpdateExam()],
        updateRequired: true,
        minimumSupportedVersion: REQUIRED_APP_VERSION,
        downloadUrl: `${SITE_URL}/Apk/`,
        message: "هذا الإصدار متوقف. نزّل التحديث الجديد.",
      },
      {
        status: 200,
        headers: {
          "Cache-Control": "no-store, max-age=0",
          "CDN-Cache-Control": "no-store",
          Vary: "X-MauriResults-Client, Accept-Encoding",
        },
      }
    );
  }

  const result = await fetchPublishedExams();
  const exams = publicCatalog(result.rows);
  return NextResponse.json(
    { exams },
    {
      status: 200,
      headers: {
        "Cache-Control": PUBLIC_CACHE,
        "CDN-Cache-Control": PUBLIC_CACHE,
        "Vercel-CDN-Cache-Control": PUBLIC_CACHE,
        Vary: "X-MauriResults-Client, Accept-Encoding",
      },
    }
  );
}
