"use client";

import { useEffect, useMemo, useState } from "react";
import { ArrowRight, BookOpen, ChevronDown, Download, FileText, GraduationCap, Layers3, Loader2 } from "lucide-react";
import index from "../../data/indexed-drive-study-files.json";
import { decorateStudyFile, BRANCH_LABELS, BRANCH_ORDER, examBrowseGroup, examBrowseLabel, studyDocumentKind } from "../../data/study-catalog.mjs";

const PAGE = 24;
const ORDER = ["باكالوريا", "ابريفه", "كونكور", "الامتياز", "المعهد العالي", "الأولمبياد"];
const TYPE_LABELS = { exam: "الموضوع", solution: "التصحيح", memo: "المذكرة", reference: "المرجع", bundle: "المجموعة" };
const FILES = (index.files || []).map(decorateStudyFile).filter(file => file.category === "exams" && file.competition);
const BRANCH_TRANSLATIONS = {
  "الآداب الأصلية O": "LO",
  "الآداب العصرية A": "LM",
  "الرياضيات C": "C",
  "العلوم الطبيعية D": "D",
};
function branchForDb(file) {
  return BRANCH_TRANSLATIONS[file.branch] || file.branch || "common";
}
function yearForDb(file) {
  return file.year ? String(file.year) : "undated:papers";
}
function titleWithoutExtension(value) {
  return String(value || "").replace(/\.(?:pdf|docx?)$/i, "").replace(/[\u200e\u200f]/g, "")
    .replace(/_/g, " ").replace(/\s+/g, " ").trim();
}
function yearLabel(year) {
  return examBrowseLabel(year);
}
function branchTitle(value) {
  return BRANCH_LABELS.ar[value] || value;
}
function ChoiceCard({ label, count, onClick, icon: Icon = GraduationCap }) {
  return (
    <button type="button" onClick={onClick}
      className="flex min-h-[92px] min-w-0 items-center gap-3 rounded-2xl border border-slate-200 bg-white p-4 text-start shadow-sm transition hover:border-mauri-green/40 hover:bg-emerald-50/40 active:scale-[.99] dark:border-white/10 dark:bg-[#12231a] dark:hover:bg-emerald-500/10">
      <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-mauri-green/10 text-mauri-green dark:text-emerald-300">
        <Icon className="h-5 w-5" aria-hidden="true" />
      </span>
      <span className="min-w-0 flex-1">
        <strong className="block break-words text-sm font-black leading-6 text-slate-900 dark:text-white">{label}</strong>
        <span className="mt-1 block text-xs font-semibold text-slate-500 dark:text-slate-300">{count}</span>
      </span>
    </button>
  );
}
function ExamDownload({ file, label, subtle = false }) {
  return (
    <a download href={`/api/exam-documents/download?id=${encodeURIComponent(file.id)}`}
      aria-label={`${label}: ${file.title}`}
      className={subtle
        ? "inline-flex min-h-11 flex-1 items-center justify-center gap-2 rounded-xl border border-mauri-green/25 bg-mauri-green/10 px-3 text-sm font-black text-mauri-green dark:text-emerald-300"
        : "inline-flex min-h-11 flex-1 items-center justify-center gap-2 rounded-xl bg-mauri-green px-3 text-sm font-black text-white hover:bg-emerald-700"}>
      <Download className="h-4 w-4" aria-hidden="true" />{label}
    </a>
  );
}
function SubjectCard({ group }) {
  const exam = group.documents.find(file => file.document_type === "exam");
  const solution = group.documents.find(file => file.document_type === "solution");
  const extras = group.documents.filter(file => file !== exam && file !== solution);
  return (
    <article className="flex min-w-0 flex-col gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-white/10 dark:bg-[#12231a]">
      <div className="flex min-w-0 items-start gap-2">
        <FileText className="mt-1 h-5 w-5 shrink-0 text-mauri-green" aria-hidden="true" />
        <div className="min-w-0 flex-1">
          <h3 className="break-words text-sm font-black leading-6 text-slate-900 dark:text-white">{group.subject}</h3>
          {(group.branch || group.session) && <p className="mt-1 text-xs font-semibold text-slate-500 dark:text-slate-300">
            {[group.branch, group.session].filter(Boolean).join(" · ")}
          </p>}
        </div>
      </div>
      <div className="mt-auto flex flex-wrap gap-2">
        {exam && <ExamDownload file={exam} label="الموضوع" />}
        {solution && <ExamDownload file={solution} label="التصحيح" subtle />}
        {extras.map(file => <ExamDownload key={file.id} file={file} label={TYPE_LABELS[file.document_type] || "الملف"} subtle />)}
      </div>
    </article>
  );
}
export default function ExamLibrary() {
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [competition, setCompetition] = useState("");
  const [branch, setBranch] = useState("");
  const [year, setYear] = useState("");
  const [showOlder, setShowOlder] = useState(false);
  const [shown, setShown] = useState(PAGE);
  const [downloading, setDownloading] = useState("");
  const [downloadError, setDownloadError] = useState("");

  useEffect(() => {
    let active = true;
    async function fetchDocuments() {
      try {
        const response = await fetch("/api/exam-documents", { cache: "no-store" });
        const result = await response.json();
        if (!response.ok) throw new Error(result.error || "تعذر تحميل الامتحانات.");
        if (active) setDocuments(Array.isArray(result.documents) ? result.documents : []);
      } catch (cause) {
        if (active) setError(cause.message || "تعذر تحميل المصادر الإضافية.");
      } finally {
        if (active) setLoading(false);
      }
    }
    fetchDocuments();
    return () => { active = false; };
  }, []);

  const archiveDocs = useMemo(() => documents.map(file => ({
    ...file, sourceType: "archive", branches: [branchForDb(file)], yearGroup: yearForDb(file),
  })), [documents]);
  const driveDocs = useMemo(() => FILES.map(file => ({
    ...file, sourceType: "drive", yearGroup: examBrowseGroup(file),
  })), []);
  const all = useMemo(() => [...archiveDocs, ...driveDocs], [archiveDocs, driveDocs]);

  const competitions = useMemo(() => ORDER.map(name => ({
    name, count: all.filter(file => file.competition === name).length,
  })).filter(item => item.count > 0), [all]);
  const competitionFiles = useMemo(() => all.filter(file => file.competition === competition), [all, competition]);
  const branches = useMemo(() => {
    const names = new Set(competitionFiles.flatMap(file => file.branches));
    return [...names].sort((a, b) => {
      const i = BRANCH_ORDER.indexOf(a), j = BRANCH_ORDER.indexOf(b);
      if (i < 0 && j < 0) return a.localeCompare(b, "ar");
      return (i < 0 ? 99 : i) - (j < 0 ? 99 : j);
    });
  }, [competitionFiles]);
  const needsBranch = branches.length > 1;
  const selectedBranch = needsBranch ? branch : branches[0];
  const branchFiles = useMemo(() =>
    competitionFiles.filter(file => !needsBranch || file.branches.includes(selectedBranch)),
    [competitionFiles, needsBranch, selectedBranch]);
  const years = useMemo(() => {
    const names = [...new Set(branchFiles.map(file => file.yearGroup))];
    const score = value => /^\\d{4}$/.test(value) ? Number(value) * 10 + 2 :
      value.startsWith("school:") ? Number(value.slice(7, 11)) * 10 + 1 :
      value.startsWith("archives:") ? 2 : value.startsWith("undated:") ? 1 : 0;
    return names.sort((a, b) => score(b) - score(a));
  }, [branchFiles]);
  const filtered = useMemo(() => branchFiles.filter(file => file.yearGroup === year), [branchFiles, year]);

  // Preserve official subject/solution pairing from the existing trusted database.
  const cards = useMemo(() => {
    const map = new Map();
    for (const file of filtered) {
      if (file.sourceType === "drive") continue;
      const key = [file.competition, file.yearGroup, file.session || "", file.branch || "", file.subject].join("|");
      if (!map.has(key)) map.set(key, {
        key: `db-${key}`, sourceType: "archive", subject: file.subject,
        branch: file.branch, session: file.session, documents: [],
      });
      map.get(key).documents.push(file);
    }
    const result = [...map.values()];
    for (const file of filtered) {
      if (file.sourceType !== "drive") continue;
      result.push({ key: `drive-${file.id}`, sourceType: "drive", file, subject: file.subject });
    }
    return result.sort((a, b) => String(a.subject).localeCompare(String(b.subject), "ar"));
  }, [filtered]);

  function chooseCompetition(value) {
    setCompetition(value); setBranch(""); setYear(""); setShowOlder(false); setShown(PAGE); setDownloadError("");
  }
  function goBack() {
    setDownloadError("");
    if (year) { setYear(""); setShown(PAGE); return; }
    if (branch) { setBranch(""); return; }
    setCompetition("");
    setShowOlder(false);
  }
  async function downloadFromDrive(file) {
    if (downloading) return;
    const url = `/api/study-files/download?id=${encodeURIComponent(file.id)}`;
    setDownloading(file.id); setDownloadError("");
    try {
      const check = await fetch(url, { method: "HEAD", cache: "no-store" });
      if (!check.ok) throw new Error("unavailable");
      window.location.assign(url);
    } catch {
      setDownloadError("تعذر تنزيل هذا الملف مباشرة. استخدم «عرض» إذا سمح صاحبه بالوصول إليه.");
    } finally { setDownloading(""); }
  }

  if (loading) return <div role="status" className="flex min-h-32 items-center justify-center gap-2 text-sm font-semibold text-slate-500 dark:text-slate-300">
    <Loader2 className="h-5 w-5 animate-spin text-mauri-green" aria-hidden="true" />جاري تحميل الملفات…
  </div>;

  const step = !competition ? "competition" : needsBranch && !branch ? "branch" : !year ? "year" : "files";

  return (
    <div className="space-y-4">
      {error && <p role="alert" className="rounded-xl bg-red-50 p-3 text-sm font-bold text-red-700 dark:bg-red-500/10 dark:text-red-300">{error}</p>}
      <div className="flex items-center justify-between gap-3">
        <div className="min-w-0">
          <h2 className="text-lg font-black text-slate-900 dark:text-white">
            {step === "competition" ? "اختر الامتحان" : step === "branch" ? "اختر الشعبة" : step === "year" ? "اختر السنة" : "الملفات"}
          </h2>
          {competition && <p className="mt-1 text-xs font-semibold text-slate-500 dark:text-slate-300">
            {[competition, needsBranch && branch ? branchTitle(branch) : null, year ? yearLabel(year) : null].filter(Boolean).join(" / ")}
          </p>}
        </div>
        {competition && <button type="button" onClick={goBack}
          className="inline-flex min-h-10 shrink-0 items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 text-sm font-black text-mauri-green dark:border-white/10 dark:bg-[#12231a]">
          <ArrowRight className="h-4 w-4" aria-hidden="true" />رجوع
        </button>}
      </div>

      {step === "competition" ? (
        <section aria-label="المسابقات" className="grid grid-cols-2 gap-3 md:grid-cols-3">
          {competitions.map(({ name, count }) => <ChoiceCard key={name} label={name} count={count}
            onClick={() => chooseCompetition(name)} />)}
        </section>
      ) : step === "branch" ? (
        <section aria-label="الشعب" className="grid grid-cols-2 gap-3 md:grid-cols-3">
          {branches.map(value => <ChoiceCard key={value} label={branchTitle(value)}
            icon={Layers3} count={competitionFiles.filter(file => file.branches.includes(value)).length}
            onClick={() => { setBranch(value); setYear(""); setShown(PAGE); }} />)}
        </section>
      ) : step === "year" ? (
        <section aria-label="السنوات" className="grid grid-cols-2 gap-3 md:grid-cols-3">
          {years.slice(0, showOlder ? undefined : 8).map(value => (
            <ChoiceCard key={value} label={yearLabel(value)} count={branchFiles.filter(file => file.yearGroup === value).length}
              icon={BookOpen} onClick={() => { setYear(value); setShown(PAGE); }} />
          ))}
          {years.length > 8 && <button type="button" onClick={() => setShowOlder(value => !value)}
            className="flex min-h-[92px] items-center justify-center gap-2 rounded-2xl border border-dashed border-mauri-green/40 bg-white p-3 text-sm font-black text-mauri-green dark:bg-[#12231a]">
            <ChevronDown className={showOlder ? "h-4 w-4 rotate-180" : "h-4 w-4"} />{showOlder ? "أقل" : "سنوات أقدم"}
          </button>}
        </section>
      ) : (
        <section aria-label="المواضيع">
          <p aria-live="polite" className="mb-3 text-xs font-semibold text-slate-500 dark:text-slate-300">{cards.length} ملف أو مادة</p>
          {downloadError && <p role="alert" className="mb-3 rounded-xl bg-amber-50 p-3 text-sm font-bold text-amber-900 dark:bg-amber-500/10 dark:text-amber-100">{downloadError}</p>}
          {cards.length ? (
            <>
              <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
                {cards.slice(0, shown).map(card => card.sourceType === "archive"
                  ? <SubjectCard key={card.key} group={card} />
                  : <article key={card.key} className="flex min-w-0 flex-col gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-white/10 dark:bg-[#12231a]">
                    <div className="flex min-w-0 items-start gap-2">
                      <FileText className="mt-1 h-5 w-5 shrink-0 text-mauri-green" aria-hidden="true" />
                      <div className="min-w-0 flex-1">
                        <h3 className="text-sm font-black leading-6 text-slate-900 dark:text-white">{card.subject === "مواد متنوعة" ? studyDocumentKind(card.file) : card.subject}</h3>
                        <p className="mt-1 break-words text-xs font-semibold leading-5 text-slate-500 dark:text-slate-300" title={card.file.title}>
                          {titleWithoutExtension(card.file.displayTitle || card.file.title)}
                        </p>
                        <span className="mt-1 inline-block text-xs font-bold text-mauri-green">{studyDocumentKind(card.file)}</span>
                        {card.file.yearLabel && <span className="ms-2 mt-1 inline-block text-xs font-bold text-slate-500 dark:text-slate-300">{card.file.yearLabel}</span>}
                        {/bac\\s*blan|bacblan|امتحان تجريبي/i.test(card.file.title) && <span className="ms-2 inline-block text-xs font-black text-amber-600 dark:text-amber-300">امتحان تجريبي</span>}
                      </div>
                    </div>
                    <div className="mt-auto flex gap-2">
                      <button type="button" disabled={Boolean(downloading)} onClick={() => downloadFromDrive(card.file)}
                        className="inline-flex min-h-11 flex-1 items-center justify-center gap-2 rounded-xl bg-mauri-green px-3 text-sm font-black text-white disabled:opacity-60">
                        <Download className="h-4 w-4" aria-hidden="true" />{downloading === card.file.id ? "جاري التحميل…" : "تحميل"}
                      </button>
                      <a href={card.file.link} target="_blank" rel="noopener noreferrer"
                        className="inline-flex min-h-11 items-center justify-center rounded-xl border border-slate-200 px-3 text-xs font-bold text-slate-600 dark:border-white/15 dark:text-slate-200">عرض</a>
                    </div>
                  </article>)}
              </div>
              {shown < cards.length && <button type="button" onClick={() => setShown(value => value + PAGE)}
                className="mx-auto mt-4 flex min-h-11 items-center rounded-xl border border-mauri-green px-5 text-sm font-black text-mauri-green">عرض المزيد</button>}
            </>
          ) : <div className="rounded-xl border border-dashed border-slate-200 p-6 text-sm text-slate-500 dark:border-white/10">لا توجد ملفات لهذه السنة.</div>}
        </section>
      )}
    </div>
  );
}
