"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { BookOpen, Download, Eye, FileText, LibraryBig, Search, RotateCcw } from "lucide-react";
import indexed from "../../data/indexed-drive-study-files.json";
import literary from "../../data/ushare-literary-files.json";
import { decorateStudyFile, BRANCH_LABELS, BRANCH_ORDER } from "../../data/study-catalog.mjs";

const LEVELS = ["7AS", "6AS", "5AS", "4AS", "6AF"];
const TYPES = ["books", "lessons", "series", "tests", "exams"];
const TYPE_LABELS = {
  ar: { books: "الكتب", lessons: "الدروس والملخصات", series: "السلاسل والتمارين", tests: "الفروض والاختبارات", exams: "الامتحانات والتصحيحات" },
  fr: { books: "Livres", lessons: "Cours et résumés", series: "Séries et exercices", tests: "Devoirs et contrôles", exams: "Examens et corrigés" },
};
const LEVEL_LABELS = {
  ar: { all: "جميع المستويات", "7AS": "البكالوريا", "6AS": "السادسة ثانوي", "5AS": "الخامسة ثانوي", "4AS": "ابريفه", "6AF": "كونكور" },
  fr: { all: "Tous les niveaux", "7AS": "Baccalauréat", "6AS": "6AS", "5AS": "5AS", "4AS": "BEPC", "6AF": "Concours" },
};
const COPY = {
  ar: {
    title: "المكتبة التعليمية", intro: "اختر المستوى، ثم صفّ المراجع حسب الشعبة والمادة والسنة. اقرأ أو نزّل الملف من داخل MauriResults.",
    document: "مرجع", result: "نتيجة", all: "الكل", branch: "الشعبة", subject: "المادة", kind: "نوع الملف", year: "السنة",
    search: "ابحث باسم الكتاب أو المادة أو السنة...", read: "قراءة", download: "تحميل", reset: "مسح الفلاتر",
    empty: "لا توجد ملفات مطابقة. جرّب تعديل الفلاتر.", shared: "مشتركة / غير محددة", archived: "سنوات متعددة",
    undated: "غير مؤرخ", school: "السنة الدراسية", allYears: "كل السنوات", allSubjects: "كل المواد",
    allBranches: "كل الشعب", allTypes: "كل الأنواع",
  },
  fr: {
    title: "Bibliothèque éducative", intro: "Choisissez un niveau, puis filtrez par série, matière et année. Consultez les fichiers sans quitter MauriResults.",
    document: "documents", result: "résultats", all: "Tout", branch: "Série", subject: "Matière", kind: "Type", year: "Année",
    search: "Rechercher un document, une matière, une année...", read: "Lire", download: "Télécharger", reset: "Réinitialiser",
    empty: "Aucun fichier correspondant. Modifiez les filtres.", shared: "Commun / non précisé", archived: "Plusieurs années",
    undated: "Sans date", school: "Année scolaire", allYears: "Toutes les années", allSubjects: "Toutes les matières",
    allBranches: "Toutes les séries", allTypes: "Tous les types",
  },
};
const SUBJECT_FR = {
  "الرياضيات": "Mathématiques", "الفيزياء": "Physique", "الكيمياء": "Chimie",
  "الفيزياء والكيمياء": "Physique et chimie", "العلوم الطبيعية": "Sciences naturelles",
  "اللغة العربية": "Arabe", "الفرنسية": "Français", "الإنجليزية": "Anglais",
  "التاريخ والجغرافيا": "Histoire et géographie", "التربية الإسلامية": "Instruction islamique",
  "الفلسفة والفكر": "Philosophie et pensée", "التشريع الإسلامي": "Législation islamique",
  "الفكر الإسلامي": "Pensée islamique", "الفلسفة": "Philosophie",
  "التربية المدنية": "Instruction civique", "مواد متنوعة": "Divers",
};
const normalize = text => String(text || "").normalize("NFKD")
  .replace(/[\u0300-\u036f\u064b-\u065f\u0670]/g, "").toLowerCase().replace(/[_\s]+/g, " ").trim();
const niceTitle = title => String(title || "").replace(/\.(pdf|docx?)$/i, "").replace(/_/g, " ").replace(/\s+/g, " ").trim();

function getYear(file) {
  if (file.yearKind === "range") return "archives";
  if (file.yearKind === "academic" && file.yearLabel) return "school:" + file.yearLabel;
  if (file.yearKind === "single" && Number.isInteger(file.year)) return String(file.year);
  const years = [...new Set((String(file.title).match(/(?:19|20)\d{2}/g) || []))];
  return years.length === 1 ? years[0] : "undated";
}
function yearText(value, t) {
  if (value === "archives") return t.archived;
  if (value === "undated") return t.undated;
  if (value.startsWith("school:")) return t.school + " " + value.slice(7);
  return value;
}
const DOCUMENTS = (() => {
  const map = new Map(indexed.files.map(file => [file.id, decorateStudyFile(file)]));
  for (const file of literary.files) {
    if (!map.has(file.id)) map.set(file.id, decorateStudyFile(file));
  }
  return [...map.values()].filter(file => LEVELS.includes(file.level)).map(file => ({ ...file, catalogYear: getYear(file) }));
})();
const SORT_YEAR = value => /^\d{4}$/.test(value) ? Number(value) : value.startsWith("school:") ? Number(value.slice(7, 11)) : 0;

export default function StudyResourceLibrary() {
  const [lang, setLang] = useState("ar");
  const [level, setLevel] = useState("all");
  const [branch, setBranch] = useState("all");
  const [subject, setSubject] = useState("all");
  const [kind, setKind] = useState("all");
  const [year, setYear] = useState("all");
  const [query, setQuery] = useState("");
  const [shown, setShown] = useState(24);

  useEffect(() => {
    const update = event => {
      const value = event?.detail?.lang || localStorage.getItem("mauriresults-lang") || "ar";
      setLang(value === "fr" ? "fr" : "ar");
    };
    update();
    window.addEventListener("mauriresults:language-change", update);
    return () => window.removeEventListener("mauriresults:language-change", update);
  }, []);

  const t = COPY[lang];
  const chooseLevel = value => {
    setLevel(value); setBranch("all"); setSubject("all"); setKind("all"); setYear("all"); setQuery(""); setShown(24);
  };
  const base = useMemo(() => DOCUMENTS.filter(file => level === "all" || file.level === level), [level]);
  const branches = useMemo(() => BRANCH_ORDER.filter(value => base.some(file => file.branches.includes(value))), [base]);
  const afterBranch = useMemo(() => base.filter(file => branch === "all" || file.branches.includes(branch)), [base, branch]);
  const subjects = useMemo(() => [...new Set(afterBranch.map(file => file.subject))]
    .sort((a, b) => a === "مواد متنوعة" ? 1 : b === "مواد متنوعة" ? -1 : a.localeCompare(b, "ar")), [afterBranch]);
  const afterSubject = useMemo(() => afterBranch.filter(file => subject === "all" || file.subject === subject), [afterBranch, subject]);
  const types = useMemo(() => TYPES.filter(value => afterSubject.some(file => file.category === value)), [afterSubject]);
  const years = useMemo(() => [...new Set(afterSubject.filter(file => kind === "all" || file.category === kind).map(file => file.catalogYear))]
    .sort((a, b) => SORT_YEAR(b) - SORT_YEAR(a) || a.localeCompare(b)), [afterSubject, kind]);
  const result = useMemo(() => afterSubject.filter(file =>
    (kind === "all" || file.category === kind) &&
    (year === "all" || file.catalogYear === year) &&
    (!query || normalize(file.title).includes(normalize(query)) || normalize(file.subject).includes(normalize(query))))
    .sort((a, b) => SORT_YEAR(b.catalogYear) - SORT_YEAR(a.catalogYear) || a.title.localeCompare(b.title, lang === "ar" ? "ar" : "fr")),
    [afterSubject, kind, year, query, lang]);

  const reset = () => chooseLevel("all");
  const labelClass = "block min-w-0 text-xs font-bold text-slate-600 dark:text-slate-300";
  const selectClass = "mt-1 block min-h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-800 outline-none focus:border-mauri-green dark:border-white/15 dark:bg-[#12231a] dark:text-white";
  const branchesVisible = branches.length > 1;

  return (
    <section id="study-library" data-no-auto-translate dir={lang === "fr" ? "ltr" : "rtl"}
      className="mx-auto w-full max-w-7xl px-4 pb-16 pt-5 text-slate-900 dark:text-white sm:px-6 lg:px-8">
      <header className="mb-5 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-white/10 dark:bg-[#12231a]">
        <h2 className="flex items-center gap-2 text-xl font-black"><LibraryBig className="h-6 w-6 text-mauri-green" aria-hidden="true" />{t.title}</h2>
        <p className="mt-2 text-sm leading-7 text-slate-600 dark:text-slate-300">{t.intro}</p>
        <p className="mt-2 text-xs font-extrabold text-mauri-green dark:text-emerald-300">{DOCUMENTS.length} {t.document}</p>
      </header>

      <div className="mb-5 grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-6" aria-label={lang === "ar" ? "المستوى الدراسي" : "Niveau scolaire"}>
        {["all", ...LEVELS].map(value => {
          const count = value === "all" ? DOCUMENTS.length : DOCUMENTS.filter(file => file.level === value).length;
          return (
            <button key={value} type="button" onClick={() => chooseLevel(value)} aria-pressed={level === value}
              className={["min-h-[88px] rounded-2xl border p-3 text-start transition",
                level === value ? "border-mauri-green bg-mauri-green text-white shadow-sm" : "border-slate-200 bg-white hover:border-mauri-green/60 dark:border-white/10 dark:bg-[#12231a]"].join(" ")}>
              <span className="flex items-center gap-2 text-sm font-black"><BookOpen className="h-4 w-4 shrink-0" aria-hidden="true" />{LEVEL_LABELS[lang][value]}</span>
              <span className="mt-2 block text-xs font-bold opacity-75">{count} {t.document}</span>
            </button>
          );
        })}
      </div>

      <div className="mb-5 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-white/10 dark:bg-[#12231a] sm:p-5">
        <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
          {branchesVisible && (
            <label className={labelClass}>{t.branch}
              <select className={selectClass} value={branch} onChange={e => {setBranch(e.target.value);setSubject("all");setKind("all");setYear("all");setShown(24);}}>
                <option value="all">{t.allBranches}</option>
                {branches.map(value => <option key={value} value={value}>{value === "common" ? t.shared : BRANCH_LABELS[lang][value] || value}</option>)}
              </select>
            </label>
          )}
          <label className={labelClass}>{t.subject}
            <select className={selectClass} value={subject} onChange={e => {setSubject(e.target.value);setKind("all");setYear("all");setShown(24);}}>
              <option value="all">{t.allSubjects}</option>
              {subjects.map(value => <option key={value} value={value}>{lang === "fr" ? SUBJECT_FR[value] || value : value}</option>)}
            </select>
          </label>
          <label className={labelClass}>{t.kind}
            <select className={selectClass} value={kind} onChange={e => {setKind(e.target.value);setYear("all");setShown(24);}}>
              <option value="all">{t.allTypes}</option>
              {types.map(value => <option key={value} value={value}>{TYPE_LABELS[lang][value]}</option>)}
            </select>
          </label>
          <label className={labelClass}>{t.year}
            <select className={selectClass} value={year} onChange={e => {setYear(e.target.value);setShown(24);}}>
              <option value="all">{t.allYears}</option>
              {years.map(value => <option key={value} value={value}>{yearText(value, t)}</option>)}
            </select>
          </label>
        </div>
        <div className="mt-3 flex flex-wrap items-end gap-3">
          <label className="relative block min-w-[210px] flex-1 text-xs font-bold text-slate-600 dark:text-slate-300">
            <span>{lang === "fr" ? "Recherche" : "بحث"}</span>
            <Search className="pointer-events-none absolute bottom-3 right-3 h-4 w-4 text-slate-400" aria-hidden="true" />
            <input value={query} onChange={e => {setQuery(e.target.value);setShown(24);}} placeholder={t.search}
              className="mt-1 block min-h-11 w-full rounded-xl border border-slate-200 bg-white px-9 text-sm font-medium text-slate-900 outline-none focus:border-mauri-green dark:border-white/15 dark:bg-[#12231a] dark:text-white" />
          </label>
          <button type="button" onClick={reset}
            className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-slate-200 px-4 text-xs font-extrabold text-slate-700 hover:border-mauri-green dark:border-white/15 dark:text-slate-200">
            <RotateCcw className="h-4 w-4" aria-hidden="true" />{t.reset}
          </button>
        </div>
      </div>

      <p className="mb-3 text-sm font-extrabold text-slate-700 dark:text-slate-200">{result.length} {t.result}</p>
      {result.length ? (
        <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
          {result.slice(0, shown).map(file => (
            <article key={file.id} className="flex min-w-0 flex-col justify-between gap-4 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-white/10 dark:bg-[#12231a]">
              <div className="flex min-w-0 gap-3">
                <FileText className="mt-0.5 h-5 w-5 shrink-0 text-mauri-green" aria-hidden="true" />
                <div className="min-w-0 flex-1">
                  <h3 title={file.title} className="line-clamp-2 break-words text-sm font-black leading-6">{niceTitle(file.displayTitle || file.verifiedTitle || file.title)}</h3>
                  <p className="mt-2 flex flex-wrap gap-x-2 gap-y-1 text-xs font-semibold text-slate-500 dark:text-slate-300">
                    <span>{LEVEL_LABELS[lang][file.level]}</span>
                    <span>{lang === "fr" ? SUBJECT_FR[file.subject] || file.subject : file.subject}</span>
                    <span>{TYPE_LABELS[lang][file.category] || file.category}</span>
                    {file.catalogYear !== "undated" && <span>{yearText(file.catalogYear, t)}</span>}
                    {file.fileType && <span>{file.fileType}</span>}
                  </p>
                </div>
              </div>
              <div className="flex gap-2">
                {(file.fileType === "PDF" || file.fileType === "MP4") ? (
                  <Link href={"/study/reader?id=" + encodeURIComponent(file.id)}
                    className="inline-flex min-h-11 flex-1 items-center justify-center gap-2 rounded-xl bg-mauri-green px-3 text-sm font-black text-white hover:bg-emerald-700">
                    <Eye className="h-4 w-4" aria-hidden="true" />{file.fileType === "MP4" ? (lang === "ar" ? "مشاهدة" : "Voir") : t.read}
                  </Link>
                ) : null}
                <a href={"/api/study-files/download?id=" + encodeURIComponent(file.id)}
                  className="inline-flex min-h-11 flex-1 items-center justify-center gap-2 rounded-xl border border-mauri-green px-3 text-sm font-black text-mauri-green hover:bg-emerald-50 dark:hover:bg-emerald-500/10">
                  <Download className="h-4 w-4" aria-hidden="true" />{t.download}
                </a>
              </div>
            </article>
          ))}
        </div>
      ) : <p className="rounded-2xl border border-dashed border-slate-300 p-8 text-center text-sm font-semibold text-slate-500 dark:border-white/10">{t.empty}</p>}
      {shown < result.length && (
        <button type="button" onClick={() => setShown(n => n + 24)}
          className="mx-auto mt-5 block min-h-11 rounded-xl border border-mauri-green px-6 text-sm font-black text-mauri-green">
          {lang === "fr" ? "Voir plus" : "عرض المزيد"}
        </button>
      )}
    </section>
  );
}
