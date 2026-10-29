"use client";

import { useEffect, useMemo, useState } from "react";
import { BookOpen, ExternalLink, FileText, Search, FilterX } from "lucide-react";
import driveIndex from "../../data/indexed-drive-study-files.json";

const PAGE_SIZE = 24;
const ALL = "all";
const LEVELS = ["7AS", "6AS", "5AS", "4AS", "6AF", "3AF", "2AS"];
const LABELS = {
  ar: {
    title: "الملفات التعليمية المفهرسة",
    subtitle: "تصفح ملفات PDF بأسمائها الأصلية من المكتبات التعليمية المشتركة، مع روابط مباشرة إلى صفحة كل ملف على Google Drive.",
    count: "ملف PDF مفهرس",
    search: "ابحث باسم الكتاب أو الدرس أو السنة أو الشعبة…",
    allLevels: "جميع المستويات",
    allSubjects: "كل المواد",
    allBranches: "كل الشعب",
    allTypes: "جميع الأنواع",
    subject: "المادة",
    branch: "الشعبة",
    kind: "التصنيف",
    source: "المصدر",
    open: "عرض الملف على Google Drive",
    more: "عرض المزيد",
    empty: "لا توجد ملفات مطابقة. حاول البحث بكلمات أخرى.",
    reset: "مسح الفلاتر",
    disclosure: "تصنيفات المادة والمستوى مستنتجة من أسماء الملفات وقد تحتاج مراجعة. يمكن لبعض روابط Google Drive أن تتطلب إذن وصول من مالكها. لا تُستضاف هذه الملفات على MauriResults.",
    size: "الحجم",
    sources: {
      "bac-drive": "مراجع الباكالوريا",
      "fifth-drive": "مراجع الخامسة الثانوية",
      "fourth-drive": "مراجع الرابعة إعدادية",
      "fourth-guides": "أدلة الرابعة إعدادية",
      "fourth-bepc": "مراجع ابريفه",
      "sixth-drive": "مراجع السادسة ابتدائية",
      "sixth-guides": "أدلة السادسة ابتدائية",
    },
  },
  fr: {
    title: "Fichiers pédagogiques indexés",
    subtitle: "Consultez les PDF par titre original. Chaque lien ouvre le fichier sur Google Drive, sans réhébergement.",
    count: "fichiers PDF indexés",
    search: "Rechercher par livre, cours, niveau ou série…",
    allLevels: "Tous les niveaux",
    allSubjects: "Toutes les matières",
    allBranches: "Toutes les séries",
    allTypes: "Tous les types",
    subject: "Matière",
    branch: "Série",
    kind: "Catégorie",
    source: "Source",
    open: "Voir sur Google Drive",
    more: "Afficher plus",
    empty: "Aucun résultat. Modifiez votre recherche.",
    reset: "Réinitialiser",
    disclosure: "Les classifications sont déduites des noms de fichiers et peuvent nécessiter une correction. Certains liens Google Drive demandent une autorisation du propriétaire. MauriResults n’héberge pas ces PDF.",
    size: "Taille",
    sources: {
      "bac-drive": "Préparation Bac",
      "fifth-drive": "5e secondaire",
      "fourth-drive": "4e collège",
      "fourth-guides": "Guides 4AS",
      "fourth-bepc": "Références BEPC",
      "sixth-drive": "6e primaire",
      "sixth-guides": "Guides 6AF",
    },
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

function getLang() {
  if (typeof window === "undefined") return "ar";
  return localStorage.getItem("mauriresults-lang") === "fr" ? "fr" : "ar";
}
function fileSize(bytes) {
  if (!Number.isFinite(bytes) || bytes <= 0) return "";
  return bytes >= 1048576 ? `${(bytes / 1048576).toFixed(1)} MB` : `${Math.max(1, Math.round(bytes / 1024))} KB`;
}
function readable(value, lang, translations) {
  return lang === "fr" ? translations[value] || value : value;
}

export default function IndexedStudyFiles() {
  const [lang, setLang] = useState("ar");
  const [query, setQuery] = useState("");
  const [level, setLevel] = useState(ALL);
  const [subject, setSubject] = useState(ALL);
  const [branch, setBranch] = useState(ALL);
  const [kind, setKind] = useState(ALL);
  const [shown, setShown] = useState(PAGE_SIZE);
  useEffect(() => {
    const sync = (event) => {
      const value = event?.detail?.lang || getLang();
      setLang(value === "fr" ? "fr" : "ar");
    };
    sync();
    window.addEventListener("mauriresults:language-change", sync);
    return () => window.removeEventListener("mauriresults:language-change", sync);
  }, []);

  const t = LABELS[lang];
  const allFiles = driveIndex.files || [];
  const subjects = useMemo(() =>
    [...new Set(allFiles.filter(f => level === ALL || f.level === level).map(f => f.subject))].sort((a,b) => a.localeCompare(b, "ar")), [allFiles, level]);
  const branches = useMemo(() =>
    [...new Set(allFiles.filter(f => level === ALL || f.level === level).map(f => f.branch).filter(Boolean))].sort(), [allFiles, level]);
  const types = useMemo(() => [...new Set(allFiles.map(f => f.kind))].sort(), [allFiles]);

  const filtered = useMemo(() => {
    const needle = query.trim().toLocaleLowerCase();
    return allFiles.filter(f => {
      if (level !== ALL && f.level !== level) return false;
      if (subject !== ALL && f.subject !== subject) return false;
      if (branch !== ALL && f.branch !== branch) return false;
      if (kind !== ALL && f.kind !== kind) return false;
      return !needle || [f.title, f.level, f.branch, f.subject, f.kind, t.sources[f.source]]
        .join(" ").toLocaleLowerCase().includes(needle);
    });
  }, [query, level, subject, branch, kind, t, allFiles]);

  const resetShown = () => setShown(PAGE_SIZE);
  const reset = () => {
    setQuery(""); setLevel(ALL); setSubject(ALL); setBranch(ALL); setKind(ALL); resetShown();
  };

  const selectStyle = "h-12 min-w-0 rounded-xl border border-slate-200 bg-slate-50 px-3 text-sm font-bold text-slate-800 outline-none transition focus:border-mauri-green focus:ring-4 focus:ring-mauri-green/10 dark:border-white/10 dark:bg-[#07130d] dark:text-white";

  return (
    <section data-no-auto-translate dir={lang === "fr" ? "ltr" : "rtl"} className="mt-7" aria-label={t.title}>
      <header className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="flex items-center gap-2 text-xl font-black text-slate-950 dark:text-white">
            <BookOpen className="h-6 w-6 text-mauri-green" aria-hidden="true" />
            {t.title}
          </h2>
          <p className="mt-2 max-w-3xl text-sm font-semibold leading-7 text-slate-600 dark:text-slate-300">{t.subtitle}</p>
        </div>
        <span className="rounded-xl bg-mauri-green/10 px-3 py-2 text-sm font-black text-mauri-green dark:text-emerald-300">
          {allFiles.length} {t.count}
        </span>
      </header>

      <div className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm dark:border-white/10 dark:bg-[#12231a] sm:p-5">
        <label className="relative block">
          <span className="sr-only">{t.search}</span>
          <Search className="pointer-events-none absolute start-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" aria-hidden="true" />
          <input
            type="search"
            value={query}
            onChange={(event) => { setQuery(event.target.value); resetShown(); }}
            placeholder={t.search}
            className="h-12 w-full rounded-xl border border-slate-200 bg-slate-50 ps-12 pe-4 text-sm font-semibold text-slate-900 outline-none focus:border-mauri-green focus:ring-4 focus:ring-mauri-green/10 dark:border-white/10 dark:bg-[#07130d] dark:text-white"
          />
        </label>
        <div className="mt-3 grid grid-cols-2 gap-2 lg:grid-cols-4">
          <select className={selectStyle} value={level} aria-label={t.allLevels}
            onChange={event => {setLevel(event.target.value);setSubject(ALL);setBranch(ALL);resetShown();}}>
            <option value={ALL}>{t.allLevels}</option>
            {LEVELS.filter(l => allFiles.some(f => f.level === l)).map(l => <option key={l} value={l}>{l}</option>)}
          </select>
          <select className={selectStyle} value={subject} aria-label={t.allSubjects}
            onChange={event => {setSubject(event.target.value);resetShown();}}>
            <option value={ALL}>{t.allSubjects}</option>
            {subjects.map(s => <option key={s} value={s}>{readable(s,lang,SUBJECT_FR)}</option>)}
          </select>
          <select className={selectStyle} value={branch} aria-label={t.allBranches}
            onChange={event => {setBranch(event.target.value);resetShown();}}>
            <option value={ALL}>{t.allBranches}</option>
            {branches.map(b => <option key={b} value={b}>{b}</option>)}
          </select>
          <select className={selectStyle} value={kind} aria-label={t.allTypes}
            onChange={event => {setKind(event.target.value);resetShown();}}>
            <option value={ALL}>{t.allTypes}</option>
            {types.map(k => <option key={k} value={k}>{readable(k,lang,KIND_FR)}</option>)}
          </select>
        </div>
        <div className="mt-3 flex items-center justify-between gap-3 text-sm font-semibold text-slate-600 dark:text-slate-300">
          <span aria-live="polite">{filtered.length} / {allFiles.length} {t.count}</span>
          <button type="button" onClick={reset} className="inline-flex min-h-10 items-center gap-1.5 rounded-xl px-3 text-mauri-green hover:bg-mauri-green/10">
            <FilterX className="h-4 w-4" aria-hidden="true" />{t.reset}
          </button>
        </div>
      </div>

      {filtered.length > 0 ? (
        <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          {filtered.slice(0, shown).map(file => (
            <article key={file.id} className="flex min-w-0 flex-col rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-white/10 dark:bg-[#12231a]">
              <div className="flex items-center justify-between gap-2">
                <span className="rounded-lg bg-mauri-green/10 px-2.5 py-1 text-xs font-black text-mauri-green dark:text-emerald-300">{file.level}</span>
                <FileText className="h-5 w-5 shrink-0 text-slate-400" aria-hidden="true" />
              </div>
              <h3 className="mt-3 break-words text-sm font-black leading-7 text-slate-900 dark:text-white">{file.title}</h3>
              <div className="mt-3 flex flex-wrap gap-1.5 text-[11px] font-semibold text-slate-600 dark:text-slate-300">
                <span className="rounded-lg bg-slate-100 px-2 py-1.5 dark:bg-white/10">{readable(file.subject,lang,SUBJECT_FR)}</span>
                <span className="rounded-lg bg-slate-100 px-2 py-1.5 dark:bg-white/10">{readable(file.kind,lang,KIND_FR)}</span>
                {file.branch && <span className="rounded-lg bg-slate-100 px-2 py-1.5 dark:bg-white/10">{t.branch}: {file.branch}</span>}
                {file.size > 0 && <span className="rounded-lg bg-slate-100 px-2 py-1.5 dark:bg-white/10">{fileSize(file.size)}</span>}
              </div>
              <p className="mb-4 mt-3 text-xs font-medium text-slate-500 dark:text-slate-400">{t.source}: {t.sources[file.source] || "Google Drive"}</p>
              <a href={file.link} target="_blank" rel="noopener noreferrer"
                className="mt-auto inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-mauri-green px-3 py-2 text-center text-sm font-black text-white hover:bg-emerald-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-mauri-green">
                <ExternalLink className="h-4 w-4" aria-hidden="true" />{t.open}
              </a>
            </article>
          ))}
        </div>
      ) : (
        <p className="mt-5 rounded-2xl border border-dashed border-slate-200 bg-white p-6 text-center text-sm font-semibold text-slate-600 dark:border-white/10 dark:bg-[#12231a] dark:text-slate-300">{t.empty}</p>
      )}
      {filtered.length > shown && (
        <button type="button" onClick={() => setShown(v => v + PAGE_SIZE)}
          className="mx-auto mt-5 flex min-h-11 items-center justify-center rounded-xl border border-mauri-green px-5 text-sm font-black text-mauri-green hover:bg-mauri-green/10">{t.more} ({Math.min(PAGE_SIZE, filtered.length - shown)})</button>
      )}
      <p className="mt-5 text-xs font-medium leading-6 text-slate-500 dark:text-slate-400">{t.disclosure}</p>
    </section>
  );
}
