"use client";

import { useEffect, useMemo, useState } from "react";
import { BookOpen, CalendarDays, ExternalLink, FileText, FilterX, Search } from "lucide-react";
import driveIndex from "../../data/indexed-drive-study-files.json";

const ALL = "all";
const PAGE_SIZE = 24;
const LEVELS = ["7AS", "6AS", "5AS", "4AS", "6AF"];
const YEAR_KEYS = ["2026", "2025", "2024", "2023", "2022", "older", "multiple", "unspecified"];
const LEVEL_LABELS = {
  ar: {
    "7AS": "السابعة الثانوية · الباكالوريا",
    "6AS": "السادسة الثانوية",
    "5AS": "الخامسة الثانوية",
    "4AS": "الرابعة إعدادية · ابريفه",
    "6AF": "السادسة ابتدائية · كونكور",
  },
  fr: {
    "7AS": "7e secondaire · Bac",
    "6AS": "6e secondaire",
    "5AS": "5e secondaire",
    "4AS": "4e collège · BEPC",
    "6AF": "6e primaire · Concours",
  },
};
const COPY = {
  ar: {
    title: "الكتب والدروس والامتحانات",
    subtitle: "اختر قسمك الدراسي ثم المادة والسنة. يمكنك فتح كل ملف مباشرة.",
    pickLevel: "1. اختر مستواك الدراسي",
    yearHeading: "2. اختر السنة",
    filterHeading: "3. المادة ونوع الملف",
    allLevels: "كل المستويات",
    allYears: "كل السنوات",
    allSubjects: "كل المواد",
    allBranches: "كل الشعب",
    allKinds: "كل الملفات",
    older: "2021 وما قبلها",
    multiple: "عدة سنوات",
    unspecified: "دون سنة محددة",
    subject: "المادة",
    branch: "الشعبة",
    kind: "النوع",
    count: "ملف تعليمي",
    search: "ابحث عن مادة، كتاب، موضوع باكالوريا، سنة أو شعبة…",
    open: "فتح الملف",
    more: "عرض ملفات إضافية",
    empty: "لا توجد ملفات بهذه الخيارات. غيّر السنة أو المادة، أو امسح الفلاتر.",
    reset: "مسح الفلاتر",
    schoolYear: "السنة الدراسية",
    span: "الفترة",
    datedGroup: "ملفات سنة",
    schoolGroup: "السنة الدراسية",
    multipleGroup: "أرشيف سنوات متعددة",
    undatedGroup: "كتب ودروس دون سنة محددة",
    hint: "السنة المعروضة مأخوذة من اسم الملف فقط. بعض الملفات تشمل سنوات متعددة، والملفات غير المؤرخة لا تعني أنها قديمة. قد يتطلب فتح بعض الملفات إذنًا من مالكها.",
  },
  fr: {
    title: "Livres, cours et examens",
    subtitle: "Choisissez votre classe, la matière et l'année, puis ouvrez le document.",
    pickLevel: "1. Choisissez votre classe",
    yearHeading: "2. Choisissez une année",
    filterHeading: "3. Matière et type de document",
    allLevels: "Tous les niveaux",
    allYears: "Toutes les années",
    allSubjects: "Toutes les matières",
    allBranches: "Toutes les séries",
    allKinds: "Tous les documents",
    older: "2021 et avant",
    multiple: "Plusieurs années",
    unspecified: "Année non indiquée",
    subject: "Matière",
    branch: "Série",
    kind: "Type",
    count: "documents",
    search: "Rechercher un cours, un livre, un examen ou une année…",
    open: "Ouvrir le fichier",
    more: "Afficher davantage",
    empty: "Aucun document ne correspond. Changez les filtres ou réinitialisez-les.",
    reset: "Réinitialiser",
    schoolYear: "Année scolaire",
    span: "Période",
    datedGroup: "Documents de",
    schoolGroup: "Année scolaire",
    multipleGroup: "Archives pluriannuelles",
    undatedGroup: "Livres et cours sans année indiquée",
    hint: "L'année provient uniquement du nom du fichier. Certaines archives couvrent plusieurs années ; un document sans date n'est pas nécessairement ancien. L'accès à certains documents peut nécessiter une autorisation.",
  },
};
const SUBJECT_FR = {
  "الرياضيات": "Mathématiques",
  "الفيزياء": "Physique",
  "الكيمياء": "Chimie",
  "العلوم الطبيعية": "Sciences naturelles",
  "اللغة العربية": "Arabe",
  "الفرنسية": "Français",
  "الإنجليزية": "Anglais",
  "التاريخ والجغرافيا": "Histoire et géographie",
  "التربية الإسلامية": "Instruction islamique",
  "الفلسفة والفكر": "Philosophie",
  "التربية المدنية": "Instruction civique",
  "مواد متنوعة": "Autres matières",
};
const KIND_FR = {
  "مراجع ودروس": "Références et cours",
  "ملخصات ومذكرات": "Résumés et fiches",
  "مواضيع امتحانات": "Sujets d’examens",
  "حل وتصحيح": "Corrigés",
  "تمارين": "Exercices",
  "كتب": "Livres",
};
const FILES = driveIndex.files || [];
function getLanguage() {
  if (typeof window === "undefined") return "ar";
  return localStorage.getItem("mauriresults-lang") === "fr" ? "fr" : "ar";
}
function translate(value, lang, dictionary) {
  return lang === "fr" ? dictionary[value] || value : value;
}
function searchText(value) {
  return (value || "").normalize("NFD").replace(/[\u0300-\u036f\u064B-\u065F\u0670]/g, "").toLocaleLowerCase().trim();
}
function fileSize(bytes) {
  if (!Number.isFinite(bytes) || bytes <= 0) return "";
  return bytes >= 1048576 ? `${(bytes / 1048576).toFixed(1)} MB` : `${Math.max(1, Math.round(bytes / 1024))} KB`;
}
function matchesYear(file, year) {
  if (year === ALL) return true;
  if (year === "unspecified") return file.yearKind === "unspecified";
  if (year === "multiple") return file.yearKind === "range";
  if (year === "older") return file.yearKind === "single" && file.year <= 2021
    || file.yearKind === "academic" && Number(file.yearLabel?.split("–")[0]) <= 2021;
  const selected = Number(year);
  if (file.yearKind === "single") return file.year === selected;
  if (file.yearKind === "academic") {
    return file.yearLabel?.split("–").some(y => Number(y) === selected) || false;
  }
  return false;
}
function sortRank(file) {
  if (file.yearKind === "single") return 10000 + file.year * 10 + 2;
  if (file.yearKind === "academic") return 10000 + file.year * 10 + 1;
  if (file.yearKind === "range") return 10;
  return 0;
}
function groupKey(file) {
  if (file.yearKind === "single") return `single-${file.year}`;
  if (file.yearKind === "academic") return `school-${file.yearLabel}`;
  if (file.yearKind === "range") return "multiple";
  return "unspecified";
}
function groupTitle(file, t) {
  if (file.yearKind === "single") return `${t.datedGroup} ${file.year}`;
  if (file.yearKind === "academic") return `${t.schoolGroup} ${file.yearLabel}`;
  return file.yearKind === "range" ? t.multipleGroup : t.undatedGroup;
}
function quickYearLabel(value, t) {
  return YEAR_KEYS.includes(value) && Number.isNaN(Number(value)) ? t[value] : value;
}

export default function IndexedStudyFiles() {
  const [lang, setLang] = useState("ar");
  const [level, setLevel] = useState(ALL);
  const [year, setYear] = useState(ALL);
  const [subject, setSubject] = useState(ALL);
  const [branch, setBranch] = useState(ALL);
  const [kind, setKind] = useState(ALL);
  const [query, setQuery] = useState("");
  const [shown, setShown] = useState(PAGE_SIZE);

  useEffect(() => {
    const sync = (event) => {
      const next = event?.detail?.lang || getLanguage();
      setLang(next === "fr" ? "fr" : "ar");
    };
    sync();
    window.addEventListener("mauriresults:language-change", sync);
    return () => window.removeEventListener("mauriresults:language-change", sync);
  }, []);

  const t = COPY[lang];
  const filteredByLevel = useMemo(() => FILES.filter(f => level === ALL || f.level === level), [level]);
  const subjects = useMemo(() => [...new Set(filteredByLevel.map(f => f.subject))].sort((a, b) => a.localeCompare(b, "ar")), [filteredByLevel]);
  const branches = useMemo(() => [...new Set(filteredByLevel.map(f => f.branch).filter(Boolean))].sort(), [filteredByLevel]);
  const kinds = useMemo(() => [...new Set(filteredByLevel.map(f => f.kind))].sort(), [filteredByLevel]);
  const yearCounts = useMemo(() => Object.fromEntries(YEAR_KEYS.map(key => [key, filteredByLevel.filter(f => matchesYear(f, key)).length])), [filteredByLevel]);
  const results = useMemo(() => {
    const needle = searchText(query);
    return FILES.filter(file => {
      if (level !== ALL && file.level !== level) return false;
      if (!matchesYear(file, year)) return false;
      if (subject !== ALL && file.subject !== subject) return false;
      if (branch !== ALL && file.branch !== branch) return false;
      if (kind !== ALL && file.kind !== kind) return false;
      return !needle || searchText([file.title, file.level, file.branch, file.subject, file.kind, file.yearLabel].join(" ")).includes(needle);
    }).sort((a, b) => sortRank(b) - sortRank(a) || a.title.localeCompare(b.title, lang === "fr" ? "fr" : "ar"));
  }, [level, year, subject, branch, kind, query, lang]);

  const displayed = useMemo(() => {
    const groups = [];
    for (const file of results.slice(0, shown)) {
      const key = groupKey(file);
      if (groups[groups.length - 1]?.key !== key) groups.push({ key, title: groupTitle(file, t), files: [] });
      groups[groups.length - 1].files.push(file);
    }
    return groups;
  }, [results, shown, t]);

  function selectLevel(value) {
    setLevel(value); setYear(ALL); setSubject(ALL); setBranch(ALL); setKind(ALL); setShown(PAGE_SIZE);
  }
  function reset() {
    setLevel(ALL); setYear(ALL); setSubject(ALL); setBranch(ALL); setKind(ALL); setQuery(""); setShown(PAGE_SIZE);
  }
  const inputStyle = "h-11 min-w-0 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 text-sm font-semibold text-slate-800 outline-none transition focus:border-mauri-green focus:ring-4 focus:ring-mauri-green/10 dark:border-white/10 dark:bg-[#07130d] dark:text-white";
  const chipClass = (isActive) => isActive
    ? "min-h-11 rounded-xl bg-mauri-green px-3 py-2 text-xs font-black text-white shadow-sm sm:text-sm"
    : "min-h-11 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-bold text-slate-700 transition hover:border-mauri-green/50 hover:text-mauri-green dark:border-white/15 dark:bg-white/5 dark:text-slate-200 sm:text-sm";

  return (
    <section data-no-auto-translate dir={lang === "fr" ? "ltr" : "rtl"} aria-label={t.title}>
      <div className="mb-5 flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="flex items-center gap-2 text-xl font-black text-slate-950 dark:text-white">
            <BookOpen className="h-6 w-6 text-mauri-green" aria-hidden="true" />
            {t.title}
          </h2>
          <p className="mt-2 text-sm font-semibold leading-7 text-slate-600 dark:text-slate-300">{t.subtitle}</p>
        </div>
        <span className="rounded-xl bg-mauri-green/10 px-3 py-2 text-sm font-black text-mauri-green dark:text-emerald-300">{FILES.length} {t.count}</span>
      </div>

      <div className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm dark:border-white/10 dark:bg-[#12231a] sm:p-6">
        <label className="relative block">
          <span className="sr-only">{t.search}</span>
          <Search className="pointer-events-none absolute start-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" aria-hidden="true" />
          <input
            type="search"
            value={query}
            onChange={event => { setQuery(event.target.value); setShown(PAGE_SIZE); }}
            placeholder={t.search}
            className="h-12 w-full rounded-xl border border-slate-200 bg-slate-50 ps-12 pe-4 text-sm font-semibold text-slate-900 outline-none transition focus:border-mauri-green focus:ring-4 focus:ring-mauri-green/10 dark:border-white/10 dark:bg-[#07130d] dark:text-white"
          />
        </label>
        <div className="mt-6">
          <h3 className="mb-3 text-sm font-black text-slate-900 dark:text-white">{t.pickLevel}</h3>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-6" role="group" aria-label={t.pickLevel}>
            {[ALL, ...LEVELS].map(value => {
              const count = value === ALL ? FILES.length : FILES.filter(f => f.level === value).length;
              if (!count) return null;
              return (
                <button key={value} type="button" aria-pressed={level === value} onClick={() => selectLevel(value)}
                  className={chipClass(level === value) + " flex min-w-0 flex-col items-start justify-center gap-1 text-start"}>
                  <span className="w-full leading-5">{value === ALL ? t.allLevels : LEVEL_LABELS[lang][value]}</span>
                  <span className={level === value ? "text-xs text-white/85" : "text-xs text-slate-500 dark:text-slate-400"}>{count}</span>
                </button>
              );
            })}
          </div>
        </div>

        <div className="mt-6">
          <h3 className="mb-3 flex items-center gap-2 text-sm font-black text-slate-900 dark:text-white">
            <CalendarDays className="h-4 w-4 text-mauri-green" aria-hidden="true" />{t.yearHeading}
          </h3>
          <div className="flex flex-wrap gap-2" role="group" aria-label={t.yearHeading}>
            {[ALL, ...YEAR_KEYS].map(value => {
              const count = value === ALL ? filteredByLevel.length : yearCounts[value];
              if (!count) return null;
              return (
                <button key={value} type="button" aria-pressed={year === value} onClick={() => { setYear(value); setShown(PAGE_SIZE); }} className={chipClass(year === value)}>
                  {value === ALL ? t.allYears : quickYearLabel(value, t)}
                  <span className="ms-2 text-[11px] opacity-75">{count}</span>
                </button>
              );
            })}
          </div>
        </div>

        <div className="mt-6">
          <h3 className="mb-3 text-sm font-black text-slate-900 dark:text-white">{t.filterHeading}</h3>
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
            <label className="block">
              <span className="mb-1 block text-xs font-bold text-slate-500 dark:text-slate-300">{t.subject}</span>
              <select className={inputStyle} value={subject} onChange={event => { setSubject(event.target.value); setShown(PAGE_SIZE); }}>
                <option value={ALL}>{t.allSubjects}</option>
                {subjects.map(value => <option key={value} value={value}>{translate(value, lang, SUBJECT_FR)}</option>)}
              </select>
            </label>
            <label className="block">
              <span className="mb-1 block text-xs font-bold text-slate-500 dark:text-slate-300">{t.branch}</span>
              <select className={inputStyle} value={branch} onChange={event => { setBranch(event.target.value); setShown(PAGE_SIZE); }}>
                <option value={ALL}>{t.allBranches}</option>
                {branches.map(value => <option key={value} value={value}>{value}</option>)}
              </select>
            </label>
            <label className="block">
              <span className="mb-1 block text-xs font-bold text-slate-500 dark:text-slate-300">{t.kind}</span>
              <select className={inputStyle} value={kind} onChange={event => { setKind(event.target.value); setShown(PAGE_SIZE); }}>
                <option value={ALL}>{t.allKinds}</option>
                {kinds.map(value => <option key={value} value={value}>{translate(value, lang, KIND_FR)}</option>)}
              </select>
            </label>
          </div>
        </div>

        <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 pt-4 dark:border-white/10">
          <span aria-live="polite" className="text-sm font-black text-slate-700 dark:text-slate-200">{results.length} {t.count}</span>
          <button type="button" onClick={reset} className="inline-flex min-h-10 items-center gap-2 rounded-xl px-3 text-sm font-bold text-mauri-green transition hover:bg-mauri-green/10">
            <FilterX className="h-4 w-4" aria-hidden="true" />{t.reset}
          </button>
        </div>
      </div>

      {results.length > 0 ? (
        <div className="mt-5 space-y-7">
          {displayed.map(group => (
            <section key={group.key} aria-label={group.title}>
              <h3 className="mb-3 flex items-center gap-2 text-base font-black text-slate-900 dark:text-white">
                <span className="h-5 w-1 rounded-full bg-mauri-green" aria-hidden="true" />{group.title}
              </h3>
              <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
                {group.files.map(file => (
                  <article key={file.id} className="flex min-w-0 flex-col rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-white/10 dark:bg-[#12231a]">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="rounded-lg bg-mauri-green/10 px-2.5 py-1 text-xs font-black text-mauri-green dark:text-emerald-300">{file.level}</span>
                      {file.yearKind !== "unspecified" && (
                        <span className="rounded-lg bg-amber-100 px-2.5 py-1 text-xs font-black text-amber-900 dark:bg-amber-400/15 dark:text-amber-200">
                          {file.yearKind === "academic" ? `${t.schoolYear} ${file.yearLabel}` : file.yearKind === "range" ? `${t.span} ${file.yearLabel}` : file.yearLabel}
                        </span>
                      )}
                      <span className="ms-auto inline-flex items-center gap-1 text-xs font-black text-slate-400"><FileText className="h-4 w-4" aria-hidden="true" />{file.fileType}</span>
                    </div>
                    <h4 className="mt-3 flex-1 break-words text-sm font-black leading-7 text-slate-900 dark:text-white">{file.title}</h4>
                    <div className="mt-4 flex flex-wrap gap-1.5 text-[11px] font-semibold text-slate-600 dark:text-slate-300">
                      <span className="rounded-lg bg-slate-100 px-2 py-1.5 dark:bg-white/10">{translate(file.subject, lang, SUBJECT_FR)}</span>
                      <span className="rounded-lg bg-slate-100 px-2 py-1.5 dark:bg-white/10">{translate(file.kind, lang, KIND_FR)}</span>
                      {file.branch && <span className="rounded-lg bg-slate-100 px-2 py-1.5 dark:bg-white/10">{t.branch}: {file.branch}</span>}
                      {file.size > 0 && <span className="rounded-lg bg-slate-100 px-2 py-1.5 dark:bg-white/10">{fileSize(file.size)}</span>}
                    </div>
                    <a href={file.link} target="_blank" rel="noopener noreferrer"
                      className="mt-4 inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-mauri-green px-4 py-2 text-center text-sm font-black text-white transition hover:bg-emerald-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-mauri-green">
                      <ExternalLink className="h-4 w-4" aria-hidden="true" />{t.open}
                    </a>
                  </article>
                ))}
              </div>
            </section>
          ))}
        </div>
      ) : (
        <p className="mt-5 rounded-2xl border border-dashed border-slate-200 bg-white p-7 text-center text-sm font-semibold leading-7 text-slate-600 dark:border-white/10 dark:bg-[#12231a] dark:text-slate-300">{t.empty}</p>
      )}
      {results.length > shown && (
        <button type="button" onClick={() => setShown(v => v + PAGE_SIZE)}
          className="mx-auto mt-6 flex min-h-11 items-center justify-center rounded-xl border border-mauri-green px-5 text-sm font-black text-mauri-green transition hover:bg-mauri-green/10">
          {t.more} ({Math.min(PAGE_SIZE, results.length - shown)})
        </button>
      )}
      <p className="mt-6 text-xs font-medium leading-6 text-slate-500 dark:text-slate-400">{t.hint}</p>
    </section>
  );
}
