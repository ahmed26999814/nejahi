"use client";

import { useEffect, useMemo, useState } from "react";
import { ArrowRight, ArrowLeft, BookOpen, Download, Eye, FileText, GraduationCap, Layers3 } from "lucide-react";
import index from "../../data/indexed-drive-study-files.json";
import { STUDY_TYPES, normalizeStudyTitle } from "../../data/study-file-type.mjs";
import { decorateStudyFile, BRANCH_LABELS, BRANCH_ORDER } from "../../data/study-catalog.mjs";

const GRADES = ["7AS", "6AS", "5AS", "4AS", "6AF"];
const PAGE = 20;
const FILES = (index.files || []).map(decorateStudyFile).filter(file => file.category !== "exams");
const FR_SUBJECTS = {
  "الرياضيات": "Mathématiques", "الفيزياء": "Physique", "الفيزياء والكيمياء": "Physique et chimie", "الكيمياء": "Chimie",
  "العلوم الطبيعية": "Sciences naturelles", "اللغة العربية": "Arabe",
  "الفرنسية": "Français", "الإنجليزية": "Anglais",
  "التاريخ والجغرافيا": "Histoire-géographie", "التربية الإسلامية": "Instruction islamique",
  "الفلسفة والفكر": "Philosophie", "التربية المدنية": "Instruction civique",
  "مواد متنوعة": "Autres matières",
};
const LABELS = {
  ar: {
    title: "مكتبة المراجع",
    grade: "اختر مستواك",
    branch: "اختر الشعبة",
    subject: "اختر المادة",
    type: "اختر نوع الملف",
    files: "الملفات",
    back: "رجوع",
    more: "عرض المزيد",
    download: "تحميل",
    view: "عرض",
    downloading: "جاري التحميل…",
    error: "التحميل غير متاح لهذا الملف حاليًا. يمكنك تجربة «عرض».",
    empty: "لا توجد ملفات في هذا القسم",
    types: { series: "سلاسل التمارين", exams: "الامتحانات", tests: "الفروض والاختبارات", books: "الكتب", lessons: "الدروس والملخصات" },
    grades: { "7AS": "الباكالوريا", "6AS": "السادسة ثانوي", "5AS": "الخامسة ثانوي", "4AS": "ابريفه", "6AF": "كونكور" },
    correction: "مع التصحيح",
  },
  fr: {
    title: "Bibliothèque",
    grade: "Choisir le niveau",
    branch: "Choisir la série",
    subject: "Choisir la matière",
    type: "Choisir le document",
    files: "Documents",
    back: "Retour",
    more: "Voir plus",
    download: "Télécharger",
    view: "Voir",
    downloading: "Téléchargement…",
    error: "Téléchargement indisponible. Essayez « Voir ».",
    empty: "Aucun document dans cette rubrique",
    types: { series: "Séries", exams: "Examens", tests: "Devoirs et contrôles", books: "Livres", lessons: "Cours et résumés" },
    grades: { "7AS": "Baccalauréat", "6AS": "6AS", "5AS": "5AS", "4AS": "BEPC", "6AF": "Concours" },
    correction: "Avec corrigé",
  },
};

function niceTitle(title) {
  return title.replace(/\.(?:pdf|docx?)$/i, "").replace(/[\u200e\u200f\u061c]/g, "")
    .replace(/[_]+/g, " ").replace(/\s+/g, " ").trim();
}
function rank(file) {
  return file.yearKind === "single" || file.yearKind === "academic" ? file.year || 0 : 0;
}
function ChoiceCard({ icon: Icon, title, count, onClick }) {
  return (
    <button type="button" onClick={onClick}
      className="group flex min-h-[94px] min-w-0 items-center gap-3 rounded-2xl border border-slate-200 bg-white p-4 text-start shadow-sm transition hover:border-mauri-green/50 hover:bg-emerald-50/50 active:scale-[.99] dark:border-white/10 dark:bg-[#12231a] dark:hover:bg-emerald-500/10">
      <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-mauri-green/10 text-mauri-green dark:text-emerald-300">
        <Icon className="h-5 w-5" aria-hidden="true" />
      </span>
      <span className="min-w-0 flex-1">
        <strong className="block break-words text-sm font-black leading-6 text-slate-900 dark:text-white">{title}</strong>
        <span className="mt-1 block text-xs font-semibold text-slate-500 dark:text-slate-400">{count}</span>
      </span>
    </button>
  );
}

export default function IndexedStudyFiles() {
  const [lang, setLang] = useState("ar");
  const [grade, setGrade] = useState("");
  const [branch, setBranch] = useState("");
  const [subject, setSubject] = useState("");
  const [type, setType] = useState("");
  const [shown, setShown] = useState(PAGE);
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

  const t = LABELS[lang];
  const gradeFiles = useMemo(() => FILES.filter(file => file.level === grade), [grade]);
  const splitBranches = grade === "7AS" || grade === "5AS";
  const branches = useMemo(() => BRANCH_ORDER.filter(value => gradeFiles.some(file => file.branches.includes(value))), [gradeFiles]);
  const branchFiles = useMemo(() => gradeFiles.filter(file => !splitBranches || file.branches.includes(branch)), [gradeFiles, splitBranches, branch]);
  const subjectFiles = useMemo(() => branchFiles.filter(file => file.subject === subject), [branchFiles, subject]);
  const files = useMemo(() => subjectFiles.filter(file => file.category === type)
    .sort((a, b) => rank(b) - rank(a) || a.title.localeCompare(b.title, lang === "ar" ? "ar" : "fr")), [subjectFiles, type, lang]);

  const subjects = useMemo(() => [...new Set(branchFiles.map(file => file.subject))]
    .sort((a, b) => a === "مواد متنوعة" ? 1 : b === "مواد متنوعة" ? -1 : a.localeCompare(b, "ar")), [branchFiles]);
  const kinds = useMemo(() => STUDY_TYPES.filter(kind => subjectFiles.some(file => file.category === kind)), [subjectFiles]);
  const step = !grade ? "grade" : splitBranches && !branch ? "branch" : !subject ? "subject" : !type ? "type" : "files";

  function goBack() {
    setError("");
    setShown(PAGE);
    if (type) { setType(""); return; }
    if (subject) { setSubject(""); return; }
    if (branch) { setBranch(""); return; }
    setGrade("");
  }
  async function downloadFile(file) {
    if (downloading) return;
    const url = `/api/study-files/download?id=${encodeURIComponent(file.id)}`;
    setError("");
    setDownloading(file.id);
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
    <section data-no-auto-translate dir={lang === "fr" ? "ltr" : "rtl"} aria-label={t.title}>
      <div className="mb-4 flex items-center justify-between gap-3">
        <h2 className="text-lg font-black text-slate-900 dark:text-white">{t.title}</h2>
        {step !== "grade" && (
          <button type="button" onClick={goBack}
            className="inline-flex min-h-10 items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 text-sm font-bold text-mauri-green dark:border-white/10 dark:bg-[#12231a]">
            {lang === "ar" ? <ArrowRight className="h-4 w-4" /> : <ArrowLeft className="h-4 w-4" />}{t.back}
          </button>
        )}
      </div>
      {step !== "grade" && (
        <p className="mb-4 text-sm font-semibold text-slate-500 dark:text-slate-300">
          {[grade && t.grades[grade], branch && BRANCH_LABELS[lang][branch], subject && (lang === "fr" ? FR_SUBJECTS[subject] || subject : subject), type && t.types[type]].filter(Boolean).join(" / ")}
        </p>
      )}
      <h3 className="mb-3 text-sm font-black text-slate-800 dark:text-slate-100">
        {step === "grade" ? t.grade : step === "branch" ? t.branch : step === "subject" ? t.subject : step === "type" ? t.type : t.files}
      </h3>

      {step === "grade" && (
        <div className="grid grid-cols-2 gap-3 md:grid-cols-3">
          {GRADES.map(value => (
            <ChoiceCard key={value} icon={GraduationCap} title={t.grades[value]}
              count={FILES.filter(file => file.level === value).length}
              onClick={() => { setGrade(value); setBranch(""); setSubject(""); setType(""); setShown(PAGE); }} />
          ))}
        </div>
      )}
      {step === "branch" && (
        <div className="grid grid-cols-2 gap-3 md:grid-cols-3">
          {branches.map(value => (
            <ChoiceCard key={value} icon={Layers3} title={BRANCH_LABELS[lang][value]}
              count={gradeFiles.filter(file => file.branches.includes(value)).length}
              onClick={() => { setBranch(value); setSubject(""); setType(""); setShown(PAGE); }} />
          ))}
        </div>
      )}
      {step === "subject" && (
        <div className="grid grid-cols-2 gap-3 md:grid-cols-3">
          {subjects.map(value => (
            <ChoiceCard key={value} icon={BookOpen}
              title={lang === "fr" ? FR_SUBJECTS[value] || value : value}
              count={branchFiles.filter(file => file.subject === value).length}
              onClick={() => { setSubject(value); setType(""); setShown(PAGE); }} />
          ))}
        </div>
      )}
      {step === "type" && (
        <div className="grid grid-cols-2 gap-3 md:grid-cols-3">
          {kinds.map(value => (
            <ChoiceCard key={value} icon={Layers3} title={t.types[value]}
              count={subjectFiles.filter(file => file.category === value).length}
              onClick={() => { setType(value); setShown(PAGE); }} />
          ))}
        </div>
      )}
      {step === "files" && (
        <>
          <p className="mb-3 text-xs font-semibold text-slate-500 dark:text-slate-300">{files.length} {lang === "ar" ? "ملف" : "documents"}</p>
          {error && <p role="alert" className="mb-3 rounded-xl bg-amber-50 p-3 text-sm font-bold text-amber-900 dark:bg-amber-500/10 dark:text-amber-100">{error}</p>}
          {files.length ? (
            <div className="grid gap-3 md:grid-cols-2">
              {files.slice(0, shown).map(file => (
                <article key={file.id} className="flex min-w-0 flex-col justify-between gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-white/10 dark:bg-[#12231a]">
                  <div className="flex min-w-0 gap-3">
                    <FileText className="mt-1 h-5 w-5 shrink-0 text-mauri-green" aria-hidden="true" />
                    <div className="min-w-0 flex-1">
                      <h4 className="line-clamp-2 break-words text-sm font-black leading-6 text-slate-900 dark:text-white" title={file.title}>{niceTitle(file.displayTitle || file.title)}</h4>
                      <div className="mt-1.5 flex flex-wrap gap-x-2 text-xs font-semibold text-slate-500 dark:text-slate-300">
                        <span>{t.types[file.category]}</span>
                        {file.editionYear && <span>{lang === "fr" ? "Édition" : "طبعة"} {file.editionYear}</span>}
                        {file.yearLabel && !file.editionYear && <span>{file.yearLabel}</span>}
                        {file.branches[0] !== "common" && <span>{file.branches.map(value => BRANCH_LABELS[lang][value]).join(" / ")}</span>}
                        {file.fileType && <span>{file.fileType}</span>}
                        {/corrig|correction|تصحيح|مع الحل|الحل النموذج/i.test(normalizeStudyTitle(file.title)) && <span>{t.correction}</span>}
                      </div>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button type="button" disabled={Boolean(downloading)} onClick={() => downloadFile(file)}
                      className="inline-flex min-h-11 flex-1 items-center justify-center gap-2 rounded-xl bg-mauri-green px-4 text-sm font-black text-white transition hover:bg-emerald-700 disabled:opacity-60">
                      <Download className="h-4 w-4" aria-hidden="true" />{downloading === file.id ? t.downloading : t.download}
                    </button>
                    <a href={file.link} target="_blank" rel="noopener noreferrer"
                      className="inline-flex min-h-11 items-center justify-center gap-1 rounded-xl border border-slate-200 px-3 text-xs font-bold text-slate-600 dark:border-white/15 dark:text-slate-200">
                      <Eye className="h-4 w-4" aria-hidden="true" />{t.view}
                    </a>
                  </div>
                </article>
              ))}
            </div>
          ) : <p className="rounded-xl border border-dashed border-slate-200 p-6 text-sm text-slate-500 dark:border-white/10">{t.empty}</p>}
          {shown < files.length && <button type="button" onClick={() => setShown(value => value + PAGE)}
            className="mx-auto mt-4 flex min-h-11 items-center rounded-xl border border-mauri-green px-5 text-sm font-black text-mauri-green">{t.more}</button>}
        </>
      )}
    </section>
  );
}
