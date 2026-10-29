"use client";

import { useEffect, useMemo, useState } from "react";
import { BookOpen, Download, Eye, FileText, Search, RotateCcw } from "lucide-react";
import driveIndex from "../../data/indexed-drive-study-files.json";
import { classifyStudyFile, normalizeStudyTitle, STUDY_TYPES, driveDownloadUrl } from "../../data/study-file-type.mjs";

const ALL = "all";
const LIMIT = 20;
const LEVELS = ["7AS", "6AS", "5AS", "4AS", "6AF"];
const FILES = (driveIndex.files || []).map(file => ({
  ...file,
  category: classifyStudyFile(file.title),
}));
const FR_SUBJECTS = {
  "الرياضيات": "Mathématiques",
  "الفيزياء": "Physique",
  "الكيمياء": "Chimie",
  "العلوم الطبيعية": "Sciences naturelles",
  "اللغة العربية": "Arabe",
  "الفرنسية": "Français",
  "الإنجليزية": "Anglais",
  "التاريخ والجغرافيا": "Histoire-géographie",
  "التربية الإسلامية": "Instruction islamique",
  "الفلسفة والفكر": "Philosophie",
  "التربية المدنية": "Instruction civique",
  "مواد متنوعة": "Autres",
};
const UI = {
  ar: {
    heading: "الملفات الدراسية",
    search: "ابحث عن كتاب أو درس أو امتحان...",
    all: "الكل",
    level: "المستوى",
    subject: "المادة",
    type: "المحتوى",
    year: "السنة",
    allYears: "كل السنوات",
    older: "2021 وما قبلها",
    multi: "سنوات متعددة",
    none: "دون سنة",
    reset: "إلغاء التصفية",
    found: "ملف",
    download: "تحميل",
    view: "عرض",
    more: "المزيد",
    empty: "لا توجد ملفات مطابقة",
    note: "قد يطلب Google Drive تأكيدًا للملفات الكبيرة أو إذنًا للوصول. إذا لم يبدأ التحميل، استخدم «عرض».",
    types: { series: "سلاسل Séries", exams: "امتحانات", tests: "فروض واختبارات", books: "كتب", lessons: "دروس وملخصات" },
    levels: { "7AS": "الباكالوريا", "6AS": "السادسة ثانوي", "5AS": "الخامسة ثانوي", "4AS": "ابريفه 4AS", "6AF": "كونكور 6AF" },
    correction: "تصحيح",
  },
  fr: {
    heading: "Documents scolaires",
    search: "Chercher un livre, cours ou examen...",
    all: "Tout",
    level: "Niveau",
    subject: "Matière",
    type: "Documents",
    year: "Année",
    allYears: "Toutes les années",
    older: "2021 et avant",
    multi: "Plusieurs années",
    none: "Sans année",
    reset: "Effacer les filtres",
    found: "documents",
    download: "Télécharger",
    view: "Voir",
    more: "Plus",
    empty: "Aucun document trouvé",
    note: "Google Drive peut demander une confirmation pour les gros fichiers ou une autorisation d’accès. Si le téléchargement ne démarre pas, cliquez sur « Voir ».",
    types: { series: "Séries", exams: "Examens", tests: "Devoirs & contrôles", books: "Livres", lessons: "Cours & résumés" },
    levels: { "7AS": "Bac 7AS", "6AS": "6AS", "5AS": "5AS", "4AS": "BEPC 4AS", "6AF": "Concours 6AF" },
    correction: "Corrigé",
  },
};
const YEAR_OPTIONS = ["2026", "2025", "2024", "2023", "2022", "older", "multi", "none"];

function getLanguage() {
  if (typeof window === "undefined") return "ar";
  return localStorage.getItem("mauriresults-lang") === "fr" ? "fr" : "ar";
}

function niceTitle(value) {
  return value
    .replace(/\.(?:pdf|docx?|PDF)$/i, "")
    .replace(/[\u200e\u200f\u061c]/g, "")
    .replace(/[_]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function yearMatches(file, choice) {
  if (choice === ALL) return true;
  if (choice === "none") return file.yearKind === "unspecified";
  if (choice === "multi") return file.yearKind === "range";
  if (choice === "older") return file.yearKind === "single" && file.year <= 2021 ||
    file.yearKind === "academic" && Number(file.yearLabel?.split("–")[0]) <= 2021;
  const selected = Number(choice);
  return file.yearKind === "single" && file.year === selected ||
    file.yearKind === "academic" && (file.yearLabel?.split("–").some(y => Number(y) === selected) ?? false);
}

function sortRank(file) {
  if (file.yearKind === "single" || file.yearKind === "academic") return file.year || 0;
  return 0;
}

const pill = (active) => active
  ? "min-h-10 rounded-xl bg-mauri-green px-3 py-2 text-xs font-black text-white shadow-sm sm:text-sm"
  : "min-h-10 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-bold text-slate-700 transition hover:border-mauri-green/40 hover:text-mauri-green dark:border-white/10 dark:bg-[#12231a] dark:text-slate-200 sm:text-sm";

export default function IndexedStudyFiles() {
  const [lang, setLang] = useState("ar");
  const [level, setLevel] = useState(ALL);
  const [subject, setSubject] = useState(ALL);
  const [category, setCategory] = useState(ALL);
  const [year, setYear] = useState(ALL);
  const [query, setQuery] = useState("");
  const [shown, setShown] = useState(LIMIT);

  useEffect(() => {
    const sync = event => {
      const language = event?.detail?.lang || getLanguage();
      setLang(language === "fr" ? "fr" : "ar");
    };
    sync();
    window.addEventListener("mauriresults:language-change", sync);
    return () => window.removeEventListener("mauriresults:language-change", sync);
  }, []);

  const t = UI[lang];
  const byLevel = useMemo(() => FILES.filter(file => level === ALL || file.level === level), [level]);
  const subjects = useMemo(() => [...new Set(byLevel.map(file => file.subject))].sort((a, b) => a.localeCompare(b, "ar")), [byLevel]);
  const bySubject = useMemo(() => byLevel.filter(file => subject === ALL || file.subject === subject), [byLevel, subject]);
  const countsByCategory = useMemo(() =>
    Object.fromEntries(STUDY_TYPES.map(type => [type, bySubject.filter(file => file.category === type).length])), [bySubject]);
  const yearScope = useMemo(() => bySubject.filter(file => category === ALL || file.category === category), [bySubject, category]);
  const availableYears = useMemo(() => YEAR_OPTIONS.filter(value => yearScope.some(file => yearMatches(file, value))), [yearScope]);

  const matches = useMemo(() => {
    const needle = normalizeStudyTitle(query).trim();
    return FILES.filter(file => {
      if (level !== ALL && file.level !== level) return false;
      if (subject !== ALL && file.subject !== subject) return false;
      if (category !== ALL && file.category !== category) return false;
      if (!yearMatches(file, year)) return false;
      return !needle || normalizeStudyTitle([file.title, file.subject, file.level, file.yearLabel || "", file.branch || ""].join(" ")).includes(needle);
    }).sort((a, b) => sortRank(b) - sortRank(a) || a.title.localeCompare(b.title, lang === "fr" ? "fr" : "ar"));
  }, [level, subject, category, year, query, lang]);

  const hasFilters = level !== ALL || subject !== ALL || category !== ALL || year !== ALL || query.trim() !== "";
  const resetShown = () => setShown(LIMIT);
  const reset = () => {
    setLevel(ALL); setSubject(ALL); setCategory(ALL); setYear(ALL); setQuery(""); resetShown();
  };

  return (
    <section data-no-auto-translate dir={lang === "fr" ? "ltr" : "rtl"} aria-label={t.heading}>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
        <h2 className="flex items-center gap-2 text-lg font-black text-slate-900 dark:text-white">
          <BookOpen className="h-5 w-5 text-mauri-green" aria-hidden="true" />{t.heading}
        </h2>
        <span className="text-sm font-bold text-slate-500 dark:text-slate-300">{FILES.length} {t.found}</span>
      </div>

      <div className="space-y-5 rounded-2xl border border-slate-200 bg-white p-3 shadow-sm dark:border-white/10 dark:bg-[#12231a] sm:p-5">
        <label className="relative block">
          <span className="sr-only">{t.search}</span>
          <Search className="pointer-events-none absolute start-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" aria-hidden="true" />
          <input type="search" value={query} onChange={e => { setQuery(e.target.value); resetShown(); }} placeholder={t.search}
            className="h-11 w-full rounded-xl border border-slate-200 bg-slate-50 ps-10 pe-3 text-sm font-semibold text-slate-900 outline-none focus:border-mauri-green focus:ring-2 focus:ring-mauri-green/15 dark:border-white/10 dark:bg-[#07130d] dark:text-white" />
        </label>

        <div>
          <h3 className="mb-2 text-xs font-black text-slate-500 dark:text-slate-300">{t.level}</h3>
          <div className="flex flex-wrap gap-2" role="group" aria-label={t.level}>
            {[ALL, ...LEVELS].map(key => (
              <button key={key} type="button" aria-pressed={level === key}
                onClick={() => { setLevel(key); setSubject(ALL); setCategory(ALL); setYear(ALL); resetShown(); }} className={pill(level === key)}>
                {key === ALL ? t.all : t.levels[key]}
              </button>
            ))}
          </div>
        </div>

        <div>
          <h3 className="mb-2 text-xs font-black text-slate-500 dark:text-slate-300">{t.subject}</h3>
          <div className="flex flex-wrap gap-2" role="group" aria-label={t.subject}>
            <button type="button" aria-pressed={subject === ALL} className={pill(subject === ALL)}
              onClick={() => { setSubject(ALL); setCategory(ALL); setYear(ALL); resetShown(); }}>{t.all}</button>
            {subjects.map(value => (
              <button key={value} type="button" aria-pressed={subject === value} className={pill(subject === value)}
                onClick={() => { setSubject(value); setCategory(ALL); setYear(ALL); resetShown(); }}>
                {lang === "fr" ? FR_SUBJECTS[value] || value : value}
              </button>
            ))}
          </div>
        </div>

        <div>
          <h3 className="mb-2 text-xs font-black text-slate-500 dark:text-slate-300">{t.type}</h3>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-6" role="group" aria-label={t.type}>
            {[ALL, ...STUDY_TYPES.filter(key => countsByCategory[key] > 0)].map(key => (
              <button key={key} type="button" aria-pressed={category === key}
                onClick={() => { setCategory(key); setYear(ALL); resetShown(); }}
                className={pill(category === key) + " flex min-h-[60px] flex-col items-center justify-center gap-1 text-center"}>
                <span>{key === ALL ? t.all : t.types[key]}</span>
                <span className={category === key ? "text-[11px] text-white/75" : "text-[11px] text-slate-500 dark:text-slate-400"}>
                  {key === ALL ? bySubject.length : countsByCategory[key]}
                </span>
              </button>
            ))}
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-2 border-t border-slate-100 pt-3 dark:border-white/10">
          {availableYears.length > 0 && <label className="flex items-center gap-2 text-xs font-bold text-slate-600 dark:text-slate-300">
            {t.year}
            <select value={year} onChange={e => { setYear(e.target.value); resetShown(); }}
              className="h-10 max-w-[185px] rounded-xl border border-slate-200 bg-white px-3 text-sm font-bold text-slate-800 outline-none focus:border-mauri-green dark:border-white/15 dark:bg-[#07130d] dark:text-white">
              <option value={ALL}>{t.allYears}</option>
              {availableYears.map(value => (
                <option key={value} value={value}>
                  {value === "older" ? t.older : value === "multi" ? t.multi : value === "none" ? t.none : value}
                </option>
              ))}
            </select>
          </label>}
          {hasFilters && (
            <button type="button" onClick={reset}
              className="inline-flex min-h-10 items-center gap-1 rounded-xl px-2 text-xs font-black text-mauri-green hover:bg-mauri-green/10">
              <RotateCcw className="h-4 w-4" aria-hidden="true" />{t.reset}
            </button>
          )}
        </div>
      </div>

      <div className="mb-3 mt-5 text-sm font-black text-slate-700 dark:text-slate-200" aria-live="polite">
        {matches.length} {t.found}
      </div>

      {matches.length > 0 ? (
        <div className="grid gap-3 md:grid-cols-2">
          {matches.slice(0, shown).map(file => (
            <article key={file.id} className="flex min-w-0 flex-col justify-between gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-white/10 dark:bg-[#12231a]">
              <div className="flex min-w-0 items-start gap-3">
                <FileText className="mt-1 h-5 w-5 shrink-0 text-mauri-green" aria-hidden="true" />
                <div className="min-w-0 flex-1">
                  <h3 className="line-clamp-2 break-words text-sm font-black leading-6 text-slate-900 dark:text-white" title={file.title}>
                    {niceTitle(file.title)}
                  </h3>
                  <div className="mt-2 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs font-semibold text-slate-500 dark:text-slate-300">
                    <span>{lang === "fr" ? FR_SUBJECTS[file.subject] || file.subject : file.subject}</span>
                    {file.yearLabel && <span>• {file.yearLabel}</span>}
                    {file.branch && <span>• {file.branch}</span>}
                    {file.fileType && <span>• {file.fileType}</span>}
                    {/corrig|correction|تصحيح|مع الحل|الحل النموذج/i.test(normalizeStudyTitle(file.title)) && <span className="font-black text-mauri-green">• {t.correction}</span>}
                  </div>
                </div>
              </div>
              <div className="flex gap-2">
                <a href={driveDownloadUrl(file.id)} target="_blank" rel="noopener noreferrer"
                  aria-label={`${t.download}: ${file.title}`}
                  className="inline-flex min-h-10 flex-1 items-center justify-center gap-2 rounded-xl bg-mauri-green px-3 text-sm font-black text-white transition hover:bg-emerald-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-mauri-green">
                  <Download className="h-4 w-4" aria-hidden="true" />{t.download}
                </a>
                <a href={file.link} target="_blank" rel="noopener noreferrer"
                  aria-label={`${t.view}: ${file.title}`}
                  className="inline-flex min-h-10 items-center justify-center gap-2 rounded-xl border border-slate-200 px-3 text-xs font-black text-slate-600 transition hover:bg-slate-50 dark:border-white/15 dark:text-slate-200 dark:hover:bg-white/10">
                  <Eye className="h-4 w-4" aria-hidden="true" />{t.view}
                </a>
              </div>
            </article>
          ))}
        </div>
      ) : <p className="rounded-xl border border-dashed border-slate-200 p-6 text-center text-sm font-semibold text-slate-500 dark:border-white/10 dark:text-slate-300">{t.empty}</p>}

      {shown < matches.length && (
        <button type="button" className="mx-auto mt-5 flex min-h-11 items-center justify-center rounded-xl border border-mauri-green px-5 text-sm font-black text-mauri-green hover:bg-mauri-green/10"
          onClick={() => setShown(v => v + LIMIT)}>{t.more} ({Math.min(LIMIT, matches.length - shown)})</button>
      )}
      <p className="mt-5 text-xs font-medium leading-6 text-slate-500 dark:text-slate-400">{t.note}</p>
    </section>
  );
}
