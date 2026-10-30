"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { ArrowRight, ArrowLeft, BookOpen, Download, Eye, FileText, FolderOpen, GraduationCap, Layers3, Search } from "lucide-react";
import { STUDY_REFERENCE_FILES, STUDY_LEVELS, LEVEL_TITLES } from "../../data/study-library.mjs";
import { BRANCH_ORDER, BRANCH_LABELS } from "../../data/study-catalog.mjs";

const PER_PAGE = 18;
const TEXT = {
  ar: {
    title: "المراجع والدروس", intro: "اختر المستوى، ثم الشعبة والمادة لتصل مباشرة إلى الملف.",
    level: "اختر المستوى", branch: "اختر الشعبة", subject: "اختر المادة", type: "اختر نوع المرجع", files: "المراجع المتاحة",
    back: "رجوع", book: "مرجع", read: "قراءة", watch: "مشاهدة", download: "تحميل",
    more: "عرض المزيد", results: "ملف", shared: "غير محددة الشعبة", empty: "لا توجد ملفات هنا حاليًا.",
    search: "ابحث داخل هذه الملفات...", searchLabel: "البحث بالاسم", year: "السنة",
    yearsAll: "كل السنوات", archives: "سنوات متعددة", school: "السنة الدراسية",
    types: { lessons: "الدروس والملخصات", series: "السلاسل والتمارين" },
  },
  fr: {
    title: "Cours et références", intro: "Choisissez un niveau, puis la série et la matière pour accéder aux documents.",
    level: "Choisir le niveau", branch: "Choisir la série", subject: "Choisir la matière", type: "Type de document", files: "Documents disponibles",
    back: "Retour", book: "références", read: "Lire", watch: "Regarder", download: "Télécharger",
    more: "Voir plus", results: "documents", shared: "Série non précisée", empty: "Aucun document dans cette rubrique.",
    search: "Rechercher dans ces documents...", searchLabel: "Recherche", year: "Année",
    yearsAll: "Toutes les années", archives: "Plusieurs années", school: "Année scolaire",
    types: { lessons: "Cours et résumés", series: "Séries et exercices" },
  },
};
const SUBJECT_FR = {
  "الرياضيات": "Mathématiques", "الفيزياء": "Physique", "الكيمياء": "Chimie",
  "الفيزياء والكيمياء": "Physique et chimie", "العلوم الطبيعية": "Sciences naturelles",
  "اللغة العربية": "Arabe", "الفرنسية": "Français", "الإنجليزية": "Anglais",
  "التاريخ والجغرافيا": "Histoire-géographie", "التربية الإسلامية": "Instruction islamique",
  "الفلسفة والفكر": "Philosophie", "التشريع الإسلامي": "Législation islamique",
  "الفكر الإسلامي": "Pensée islamique", "الفلسفة": "Philosophie",
  "التربية المدنية": "Instruction civique", "مواد متنوعة": "Autres matières",
};
const YEARSCORE = x => /^\d{4}$/.test(x) ? Number(x) : x.startsWith("school:") ? Number(x.slice(7, 11)) : 0;
const norm = value => String(value || "").normalize("NFKD").replace(/[\u0300-\u036f\u064b-\u065f\u0670]/g, "").toLowerCase();
const fileTitle = value => String(value || "").replace(/\.(?:pdf|docx?|mp4)$/i, "").replace(/_/g, " ").replace(/\s+/g, " ").trim();
function yearName(value, text) {
  if (value === "archives") return text.archives;
  if (value.startsWith("school:")) return text.school + " " + value.slice(7);
  return value;
}
function ChoiceCard({ label, count, icon: Icon = FolderOpen, onClick }) {
  return <button type="button" onClick={onClick}
    className="group flex min-h-[92px] min-w-0 items-center gap-3 rounded-2xl border border-slate-200 bg-white p-4 text-start shadow-sm transition hover:border-mauri-green/40 hover:bg-emerald-50/40 dark:border-white/10 dark:bg-[#12231a] dark:hover:bg-emerald-500/10">
    <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-mauri-green/10 text-mauri-green dark:text-emerald-300"><Icon className="h-5 w-5" aria-hidden="true" /></span>
    <span className="min-w-0 flex-1">
      <strong className="block break-words text-sm font-black leading-6">{label}</strong>
      <span className="mt-1 block text-xs font-semibold text-slate-500 dark:text-slate-300">{count}</span>
    </span>
  </button>;
}

export default function StudyResourceLibrary() {
  const [lang, setLang] = useState("ar");
  const [level, setLevel] = useState("");
  const [branch, setBranch] = useState("");
  const [subject, setSubject] = useState("");
  const [kind, setKind] = useState("");
  const [year, setYear] = useState("all");
  const [showOlder, setShowOlder] = useState(false);
  const [query, setQuery] = useState("");
  const [shown, setShown] = useState(PER_PAGE);

  useEffect(() => {
    const sync = event => {
      const value = event?.detail?.lang || localStorage.getItem("mauriresults-lang") || "ar";
      setLang(value === "fr" ? "fr" : "ar");
    };
    const syncSelection = () => {
      const p = new URLSearchParams(window.location.search);
      const validLevel = STUDY_LEVELS.includes(p.get("level")) ? p.get("level") : "";
      setLevel(validLevel);
      setBranch(BRANCH_ORDER.includes(p.get("branch")) ? p.get("branch") : "");
      setSubject(p.get("subject")?.slice(0,100) || "");
      setKind(["lessons", "series"].includes(p.get("kind")) ? p.get("kind") : "");
      setYear(p.get("year")?.slice(0,50) || "all");
      setShown(PER_PAGE);setShowOlder(false);setQuery("");
    };
    sync();syncSelection();
    window.addEventListener("mauriresults:language-change", sync);
    window.addEventListener("popstate", syncSelection);
    return () => {
      window.removeEventListener("mauriresults:language-change", sync);
      window.removeEventListener("popstate", syncSelection);
    };
  }, []);

  const t = TEXT[lang];
  const levelFiles = useMemo(() => STUDY_REFERENCE_FILES.filter(file => file.level === level), [level]);
  const branches = useMemo(() => BRANCH_ORDER.filter(value => levelFiles.some(file => file.branches.includes(value))), [levelFiles]);
  const needsBranch = branches.length > 1;
  const selectedBranch = needsBranch ? branch : branches[0];
  const branchFiles = useMemo(() => levelFiles.filter(file => !needsBranch || file.branches.includes(selectedBranch)), [levelFiles, needsBranch, selectedBranch]);
  const subjects = useMemo(() => [...new Set(branchFiles.map(file => file.subject))]
    .sort((a, b) => a === "مواد متنوعة" ? 1 : b === "مواد متنوعة" ? -1 : a.localeCompare(b, "ar")), [branchFiles]);
  const subjectFiles = useMemo(() => branchFiles.filter(file => file.subject === subject), [branchFiles, subject]);
  const types = useMemo(() => ["lessons", "series"].filter(value => subjectFiles.some(file => file.placement === value)), [subjectFiles]);
  const selectedType = types.length === 1 ? types[0] : kind;
  const typeFiles = useMemo(() => subjectFiles.filter(file => file.placement === selectedType), [subjectFiles, selectedType]);
  const years = useMemo(() => [...new Set(typeFiles.map(file => file.catalogYear))]
    .filter(value => value !== "undated").sort((a, b) => YEARSCORE(b) - YEARSCORE(a) || a.localeCompare(b)), [typeFiles]);
  const files = useMemo(() => typeFiles.filter(file =>
    (year === "all" || file.catalogYear === year) &&
    (!query.trim() || norm(file.title).includes(norm(query)) || norm(file.subject).includes(norm(query))))
    .sort((a, b) => YEARSCORE(b.catalogYear) - YEARSCORE(a.catalogYear) || a.title.localeCompare(b.title, lang === "ar" ? "ar" : "fr")),
    [typeFiles, year, query, lang]);
  const step = !level ? "level" : needsBranch && !branch ? "branch" : !subject ? "subject" : types.length > 1 && !kind ? "type" : "files";

  function remember(next, replaceHistory = false) {
    const state = { level, branch, subject, kind, year, ...next };
    const url = new URL(window.location.href);
    url.searchParams.set("tab", "resources");
    for (const name of ["level", "branch", "subject", "kind", "year"]) {
      if (state[name] && state[name] !== "all") url.searchParams.set(name, state[name]);
      else url.searchParams.delete(name);
    }
    window.history[replaceHistory ? "replaceState" : "pushState"]({ ...window.history.state }, "", url.pathname + url.search + url.hash);
    setLevel(state.level);setBranch(state.branch);setSubject(state.subject);
    setKind(state.kind);setYear(state.year);
    setQuery("");setShown(PER_PAGE);setShowOlder(false);
  }
  function pickLevel(value) { remember({ level:value, branch:"", subject:"", kind:"", year:"all" }); }
  function pickBranch(value) { remember({ branch:value, subject:"", kind:"", year:"all" }); }
  function pickSubject(value) { remember({ subject:value, kind:"", year:"all" }); }
  function goBack() {
    if (kind) { remember({ kind:"", year:"all" }); return; }
    if (subject) { remember({ subject:"", kind:"", year:"all" }); return; }
    if (branch) { remember({ branch:"", subject:"", kind:"", year:"all" }); return; }
    remember({ level:"", branch:"", subject:"", kind:"", year:"all" });
  }
  function branchName(value) { return value === "common" ? t.shared : BRANCH_LABELS[lang][value] || value; }
  function subjectName(value) { return lang === "fr" ? SUBJECT_FR[value] || value : value; }

  return (
    <section data-no-auto-translate dir={lang === "fr" ? "ltr" : "rtl"}
      className="mx-auto w-full max-w-7xl px-4 pb-20 pt-5 text-slate-900 dark:text-white sm:px-6 lg:px-8">
      <header className="mb-5 flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h2 className="text-xl font-black">{t.title}</h2>
          <p className="mt-1.5 text-sm leading-6 text-slate-500 dark:text-slate-300">{t.intro}</p>
          {level && <p className="mt-2 break-words text-xs font-semibold text-mauri-green dark:text-emerald-300">
            {[LEVEL_TITLES[lang][level], needsBranch && branch ? branchName(branch) : null,
              subject ? subjectName(subject) : null, kind ? t.types[kind] : null].filter(Boolean).join(" / ")}
          </p>}
        </div>
        {level && <button type="button" onClick={goBack}
          className="inline-flex min-h-10 shrink-0 items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 text-sm font-black text-mauri-green dark:border-white/10 dark:bg-[#12231a]">
          {lang === "ar" ? <ArrowRight className="h-4 w-4" /> : <ArrowLeft className="h-4 w-4" />}{t.back}
        </button>}
      </header>
      <h3 className="mb-3 text-sm font-black text-slate-800 dark:text-slate-100">
        {step === "level" ? t.level : step === "branch" ? t.branch : step === "subject" ? t.subject : step === "type" ? t.type : t.files}
      </h3>
      {step === "level" && <div className="grid grid-cols-2 gap-3 md:grid-cols-3">
        {STUDY_LEVELS.filter(value => STUDY_REFERENCE_FILES.some(file => file.level === value)).map(value =>
          <ChoiceCard key={value} icon={GraduationCap} label={LEVEL_TITLES[lang][value]}
            count={STUDY_REFERENCE_FILES.filter(file => file.level === value).length + " " + t.book}
            onClick={() => pickLevel(value)} />)}
      </div>}
      {step === "branch" && <div className="grid grid-cols-2 gap-3 md:grid-cols-3">
        {branches.map(value => <ChoiceCard key={value} icon={Layers3} label={branchName(value)}
          count={levelFiles.filter(file => file.branches.includes(value)).length + " " + t.book}
          onClick={() => pickBranch(value)} />)}
      </div>}
      {step === "subject" && <div className="grid grid-cols-2 gap-3 md:grid-cols-3">
        {subjects.map(value => <ChoiceCard key={value} icon={BookOpen} label={subjectName(value)}
          count={branchFiles.filter(file => file.subject === value).length + " " + t.book}
          onClick={() => pickSubject(value)} />)}
      </div>}
      {step === "type" && <div className="grid grid-cols-2 gap-3 md:grid-cols-3">
        {types.map(value => <ChoiceCard key={value} icon={FileText} label={t.types[value]}
          count={subjectFiles.filter(file => file.placement === value).length + " " + t.book}
          onClick={() => remember({kind:value,year:"all"})} />)}
      </div>}
      {step === "files" && <>
        {years.length > 0 && <div className="mb-4 flex flex-wrap gap-2" aria-label={t.year}>
          <button type="button" aria-pressed={year === "all"} onClick={() => remember({year:"all"}, true)}
            className={"min-h-10 rounded-xl border px-3 text-xs font-bold " + (year === "all" ? "border-mauri-green bg-mauri-green text-white" : "border-slate-200 bg-white dark:border-white/10 dark:bg-[#12231a]")}>{t.yearsAll}</button>
          {years.slice(0, showOlder ? undefined : 5).map(value => <button key={value} type="button"
            aria-pressed={year === value} onClick={() => remember({year:value}, true)}
            className={"min-h-10 rounded-xl border px-3 text-xs font-bold " + (year === value ? "border-mauri-green bg-mauri-green text-white" : "border-slate-200 bg-white dark:border-white/10 dark:bg-[#12231a]")}>{yearName(value, t)}</button>)}
          {years.length > 5 && <button type="button" onClick={() => setShowOlder(!showOlder)}
            className="min-h-10 rounded-xl border border-mauri-green/40 px-3 text-xs font-bold text-mauri-green">{showOlder ? t.back : "+ " + (years.length - 5)}</button>}
        </div>}
        <label className="relative mb-4 block max-w-lg text-xs font-bold text-slate-600 dark:text-slate-300">
          <span>{t.searchLabel}</span>
          <Search className="pointer-events-none absolute bottom-3 right-3 h-4 w-4 text-slate-400" aria-hidden="true" />
          <input type="search" value={query} onChange={e => { setQuery(e.target.value); setShown(PER_PAGE); }}
            placeholder={t.search}
            className="mt-1 min-h-11 w-full rounded-xl border border-slate-200 bg-white px-9 text-sm font-semibold text-slate-900 outline-none focus:border-mauri-green dark:border-white/10 dark:bg-[#12231a] dark:text-white" />
        </label>
        <p aria-live="polite" className="mb-3 text-xs font-semibold text-slate-500 dark:text-slate-300">{files.length} {t.results}</p>
        {files.length ? <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          {files.slice(0, shown).map(file => <article key={file.id}
            className="flex min-w-0 flex-col justify-between gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-white/10 dark:bg-[#12231a]">
            <div className="flex gap-3">
              <FileText className="mt-0.5 h-5 w-5 shrink-0 text-mauri-green" aria-hidden="true" />
              <div className="min-w-0 flex-1">
                <h4 title={file.title} className="line-clamp-3 break-words text-sm font-black leading-6">{fileTitle(file.displayTitle || file.title)}</h4>
                <p className="mt-2 flex flex-wrap gap-x-2 gap-y-1 text-xs font-semibold text-slate-500 dark:text-slate-300">
                  <span>{t.types[file.placement]}</span>
                  {file.catalogYear !== "undated" && <span>{yearName(file.catalogYear, t)}</span>}
                  {file.fileType && <span>{file.fileType}</span>}
                </p>
              </div>
            </div>
            <div className="flex gap-2">
              {(file.fileType === "PDF" || file.fileType === "MP4") && <Link href={"/study/reader?" + new URLSearchParams({
                id:file.id, from:"resources", level, branch, subject,
                kind, year: year === "all" ? "" : year
              }).toString()}
                className="inline-flex min-h-11 flex-1 items-center justify-center gap-2 rounded-xl bg-mauri-green px-3 text-sm font-black text-white">
                <Eye className="h-4 w-4" aria-hidden="true" />{file.fileType === "MP4" ? t.watch : t.read}
              </Link>}
              <a href={"/api/study-files/download?id=" + encodeURIComponent(file.id)}
                className="inline-flex min-h-11 flex-1 items-center justify-center gap-2 rounded-xl border border-mauri-green px-3 text-sm font-black text-mauri-green">
                <Download className="h-4 w-4" aria-hidden="true" />{t.download}
              </a>
            </div>
          </article>)}
        </div> : <p className="rounded-2xl border border-dashed border-slate-200 p-6 text-sm font-semibold text-slate-500 dark:border-white/10">{t.empty}</p>}
        {shown < files.length && <button type="button" onClick={() => setShown(n => n + PER_PAGE)}
          className="mx-auto mt-4 block min-h-11 rounded-xl border border-mauri-green px-5 text-sm font-black text-mauri-green">{t.more}</button>}
      </>}
    </section>
  );
}
