"use client";

import { useEffect, useMemo, useState } from "react";
import { BookOpen, Download, Eye, FileText, FolderOpen, Search } from "lucide-react";
import archive from "../../data/ushare-literary-files.json";

const PAGE_SIZE = 18;
const TYPES = ["books", "lessons", "series", "exams", "tests"];
const UI = {
  ar: {
    title: "مراجع الشعب الأدبية – مكتبة uShare",
    description: "الملفات الأصلية المنقولة بإذن صاحب المكتبة، بعد إزالة المكرر. الملفات التي لا تحدد شعبة بعينها تظهر ضمن المراجع غير المحددة.",
    all: "جميع الملفات", original: "الآداب الأصلية LO", modern: "الآداب العصرية LM", common: "غير محددة الشعبة",
    subject: "جميع المواد", kind: "جميع الأنواع", search: "ابحث عن كتاب أو مذكرة أو امتحان...",
    download: "تحميل", downloading: "جاري الفحص...", preview: "عرض", more: "عرض المزيد",
    folder: "فتح مجلد المكتبة على Google Drive", empty: "لا توجد ملفات مطابقة.",
    error: "تعذر التحميل المباشر لهذا الملف. جرب زر «عرض» في Google Drive.",
    types: { books: "كتب", lessons: "دروس ومذكرات", series: "سلاسل وتمارين", exams: "امتحانات وتصحيحات", tests: "فروض واختبارات" },
    commonLabel: "الشعبة غير محددة", documents: "ملفًا فريدًا", extra: "قد تكون بعض المواد المشتركة غير مخصصة لكل شعبة",
  },
  fr: {
    title: "Ressources littéraires – bibliothèque uShare",
    description: "Fichiers transférés avec l'autorisation du propriétaire et dédoublonnés. Les séries non vérifiées restent non attribuées.",
    all: "Tous les documents", original: "Lettres originelles LO", modern: "Lettres modernes LM", common: "Série non précisée",
    subject: "Toutes les matières", kind: "Tous les types", search: "Rechercher un document...",
    download: "Télécharger", downloading: "Vérification...", preview: "Voir", more: "Voir plus",
    folder: "Ouvrir le dossier Google Drive", empty: "Aucun fichier correspondant.",
    error: "Téléchargement direct indisponible. Essayez « Voir » sur Google Drive.",
    types: { books: "Livres", lessons: "Cours et fiches", series: "Séries et exercices", exams: "Examens et corrigés", tests: "Contrôles" },
    commonLabel: "Série non précisée", documents: "documents distincts", extra: "Les documents non attribués ne conviennent pas nécessairement à toutes les séries",
  },
};
const SUBJECT_FR = {
  "اللغة العربية": "Arabe", "الفرنسية": "Français", "الإنجليزية": "Anglais",
  "التاريخ والجغرافيا": "Histoire-géographie", "التشريع الإسلامي": "Législation islamique",
  "الفكر الإسلامي": "Pensée islamique", "الفلسفة": "Philosophie",
  "الرياضيات": "Mathématiques", "مواد متنوعة": "Autres matières",
};
const normalize = value => String(value || "").normalize("NFKD").replace(/[\u0300-\u036f\u064b-\u065f\u0670]/g, "").toLowerCase();
const displayTitle = title => String(title).replace(/\.(?:pdf|docx?)$/i, "").replace(/_/g, " ").replace(/\s+/g, " ").trim();

export default function LiteraryStudyFiles() {
  const [lang, setLang] = useState("ar");
  const [branch, setBranch] = useState("all");
  const [subject, setSubject] = useState("all");
  const [kind, setKind] = useState("all");
  const [query, setQuery] = useState("");
  const [shown, setShown] = useState(PAGE_SIZE);
  const [downloading, setDownloading] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    const sync = event => {
      const value = event?.detail?.lang || localStorage.getItem("mauriresults-lang") || "ar";
      setLang(value === "fr" ? "fr" : "ar");
    };
    sync();
    window.addEventListener("mauriresults:language-change", sync);
    return () => window.removeEventListener("mauriresults:language-change", sync);
  }, []);

  const t = UI[lang];
  const matchesBranch = file => branch === "all" ||
    (branch === "common" ? file.verifiedBranches.includes("common") :
      file.verifiedBranches.includes(branch) || file.verifiedBranches.includes("common"));
  const branchFiles = useMemo(() => archive.files.filter(matchesBranch), [branch]);
  const subjects = useMemo(() => [...new Set(branchFiles.map(file => file.verifiedSubject))]
    .sort((a, b) => a === "مواد متنوعة" ? 1 : b === "مواد متنوعة" ? -1 : a.localeCompare(b, "ar")), [branchFiles]);
  const categoryFiles = useMemo(() => branchFiles.filter(file => subject === "all" || file.verifiedSubject === subject), [branchFiles, subject]);
  const kinds = useMemo(() => TYPES.filter(type => categoryFiles.some(file => file.verifiedType === type)), [categoryFiles]);
  const results = useMemo(() => categoryFiles.filter(file =>
    (kind === "all" || file.verifiedType === kind) && (!query || normalize(file.title).includes(normalize(query))))
    .sort((a, b) => a.title.localeCompare(b.title, lang === "ar" ? "ar" : "fr")), [categoryFiles, kind, query, lang]);

  function chooseBranch(value) { setBranch(value); setSubject("all"); setKind("all"); setShown(PAGE_SIZE); setError(""); }
  async function download(file) {
    if (downloading) return;
    const url = `/api/study-files/download?id=${encodeURIComponent(file.id)}`;
    setDownloading(file.id); setError("");
    try {
      const response = await fetch(url, { method: "HEAD", cache: "no-store" });
      if (!response.ok) throw new Error("Unavailable");
      window.location.assign(url);
    } catch {
      setError(t.error);
    } finally {
      setDownloading("");
    }
  }

  return (
    <section id="literary-resources" data-no-auto-translate dir={lang === "fr" ? "ltr" : "rtl"}
      className="mt-8 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-white/10 dark:bg-[#12231a] sm:p-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="flex items-center gap-2 text-lg font-black text-slate-900 dark:text-white">
            <BookOpen className="h-5 w-5 text-mauri-green" aria-hidden="true" />{t.title}
          </h2>
          <p className="mt-2 max-w-3xl text-sm leading-7 text-slate-600 dark:text-slate-300">{t.description}</p>
          <p className="mt-1 text-xs font-bold text-mauri-green dark:text-emerald-300">{archive.files.length} {t.documents}</p>
        </div>
        <a href={archive.folderUrl} target="_blank" rel="noopener noreferrer"
          className="inline-flex min-h-10 items-center gap-2 rounded-xl border border-mauri-green px-3 py-2 text-xs font-black text-mauri-green hover:bg-emerald-50 dark:hover:bg-emerald-500/10">
          <FolderOpen className="h-4 w-4" aria-hidden="true" />{t.folder}
        </a>
      </div>
      <div className="mt-5 grid grid-cols-2 gap-2 md:grid-cols-4" role="group" aria-label={t.title}>
        {[
          ["all", t.all], ["LO", t.original], ["LM", t.modern], ["common", t.common],
        ].map(([value, label]) => (
          <button key={value} type="button" aria-pressed={branch === value}
            onClick={() => chooseBranch(value)}
            className={`min-h-12 rounded-xl border px-2 py-2 text-xs font-black transition sm:text-sm ${branch === value
              ? "border-mauri-green bg-mauri-green text-white" :
                "border-slate-200 bg-slate-50 text-slate-700 hover:border-mauri-green/50 dark:border-white/10 dark:bg-white/5 dark:text-slate-200"}`}>
            {label}
          </button>
        ))}
      </div>
      {(branch === "LO" || branch === "LM") && <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">{t.extra}</p>}
      <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
          {t.subject}
          <select value={subject} onChange={e => {setSubject(e.target.value);setKind("all");setShown(PAGE_SIZE);}}
            className="mt-1 block min-h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-900 dark:border-white/15 dark:bg-[#12231a] dark:text-white">
            <option value="all">{t.subject}</option>
            {subjects.map(x => <option key={x} value={x}>{lang === "fr" ? SUBJECT_FR[x] || x : x}</option>)}
          </select>
        </label>
        <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
          {t.kind}
          <select value={kind} onChange={e => {setKind(e.target.value);setShown(PAGE_SIZE);}}
            className="mt-1 block min-h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-900 dark:border-white/15 dark:bg-[#12231a] dark:text-white">
            <option value="all">{t.kind}</option>
            {kinds.map(x => <option key={x} value={x}>{t.types[x]}</option>)}
          </select>
        </label>
        <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
          <span className="inline-flex items-center gap-1"><Search className="h-3.5 w-3.5" aria-hidden="true" />{lang === "ar" ? "بحث" : "Recherche"}</span>
          <input value={query} onChange={e => {setQuery(e.target.value);setShown(PAGE_SIZE);}} placeholder={t.search}
            className="mt-1 block min-h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-900 placeholder:text-slate-400 dark:border-white/15 dark:bg-[#12231a] dark:text-white" />
        </label>
      </div>
      <p className="my-4 text-xs font-bold text-slate-500 dark:text-slate-400">{results.length} {t.documents}</p>
      {error && <p role="alert" className="mb-3 rounded-xl bg-amber-50 p-3 text-sm font-semibold text-amber-900 dark:bg-amber-500/10 dark:text-amber-100">{error}</p>}
      {results.length ? (
        <div className="grid gap-3 md:grid-cols-2">
          {results.slice(0, shown).map(file => (
            <article key={file.id} className="flex flex-col justify-between gap-3 rounded-2xl border border-slate-200 bg-slate-50 p-4 dark:border-white/10 dark:bg-white/5">
              <div className="flex min-w-0 gap-3">
                <FileText className="mt-1 h-5 w-5 shrink-0 text-mauri-green" aria-hidden="true" />
                <div className="min-w-0">
                  <h3 title={file.title} className="line-clamp-2 break-words text-sm font-black leading-6 text-slate-900 dark:text-white">
                    {displayTitle(file.verifiedTitle || file.title)}
                  </h3>
                  <p className="mt-1.5 text-xs leading-6 text-slate-500 dark:text-slate-300">
                    {lang === "fr" ? SUBJECT_FR[file.verifiedSubject] || file.verifiedSubject : file.verifiedSubject}
                    {" · "}{t.types[file.verifiedType]}
                    {" · "}{file.verifiedBranches.includes("common") ? t.commonLabel : file.verifiedBranches.join(" / ")}
                    {file.level !== "7AS" ? ` · ${file.level}` : ""}
                    {" · "}{file.fileType}
                  </p>
                </div>
              </div>
              <div className="flex gap-2">
                <button type="button" disabled={Boolean(downloading)} onClick={() => download(file)}
                  className="inline-flex min-h-11 flex-1 items-center justify-center gap-2 rounded-xl bg-mauri-green px-3 text-sm font-black text-white hover:bg-emerald-700 disabled:opacity-60">
                  <Download className="h-4 w-4" aria-hidden="true" />{downloading === file.id ? t.downloading : t.download}
                </button>
                <a href={file.link} target="_blank" rel="noopener noreferrer"
                  className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-slate-200 px-3 text-xs font-black text-slate-700 dark:border-white/15 dark:text-slate-200">
                  <Eye className="h-4 w-4" aria-hidden="true" />{t.preview}
                </a>
              </div>
            </article>
          ))}
        </div>
      ) : <p className="rounded-xl border border-dashed border-slate-200 p-5 text-sm text-slate-500 dark:border-white/15">{t.empty}</p>}
      {shown < results.length && (
        <button type="button" onClick={() => setShown(n => n + PAGE_SIZE)}
          className="mx-auto mt-4 flex min-h-11 items-center rounded-xl border border-mauri-green px-6 text-sm font-black text-mauri-green">{t.more}</button>
      )}
    </section>
  );
}
