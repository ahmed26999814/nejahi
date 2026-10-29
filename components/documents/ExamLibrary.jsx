"use client";

import { useEffect, useMemo, useState } from "react";
import { BookOpen, ChevronDown, Download, FileText, GraduationCap, Loader2 } from "lucide-react";

const ALL = "الكل";
const COMPETITION_ORDER = ["باكالوريا", "ابريفه", "كونكور", "الامتياز", "المعهد العالي"];
const TYPES = { exam: "الموضوع", solution: "التصحيح", memo: "مذكرة", reference: "مرجع", bundle: "مجموعة" };
const OLDER_COUNT = 7;
const PAGE_SIZE = 36;

function yearKey(file) { return file.year ? String(file.year) : "undated"; }
function sourceFileGroup(file) {
  return [file.competition, yearKey(file), file.session || "", file.branch || "", file.subject || ""].join("|");
}
function ExamDownload({ file, label, subtle = false }) {
  return (
    <a
      href={`/api/exam-documents/download?id=${encodeURIComponent(file.id)}`}
      download
      aria-label={`${label}: ${file.title}`}
      className={subtle
        ? "inline-flex min-h-10 flex-1 items-center justify-center gap-1.5 rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-3 text-sm font-black text-emerald-700 transition hover:bg-emerald-500/20 dark:text-emerald-300"
        : "inline-flex min-h-10 flex-1 items-center justify-center gap-1.5 rounded-xl bg-mauri-green px-3 text-sm font-black text-white transition hover:bg-emerald-700"}>
      <Download className="h-4 w-4" aria-hidden="true" />{label}
    </a>
  );
}
function SubjectCard({ group }) {
  const exam = group.documents.find(file => file.document_type === "exam");
  const solution = group.documents.find(file => file.document_type === "solution");
  const extras = group.documents.filter(file => file !== exam && file !== solution);
  return (
    <article className="flex min-w-0 flex-col gap-3 rounded-2xl border border-slate-200 bg-white p-3.5 shadow-sm dark:border-white/10 dark:bg-[#12231a]">
      <div className="flex min-w-0 items-start justify-between gap-2">
        <div className="min-w-0">
          <h3 className="break-words text-base font-black leading-6 text-slate-900 dark:text-white">{group.subject}</h3>
          <div className="mt-1.5 flex flex-wrap gap-2 text-xs font-semibold text-slate-500 dark:text-slate-300">
            {group.branch && <span>{group.branch}</span>}
            {group.session && <span>{group.session}</span>}
          </div>
        </div>
        <FileText className="h-5 w-5 shrink-0 text-mauri-green" aria-hidden="true" />
      </div>
      <div className="mt-auto flex flex-wrap gap-2">
        {exam && <ExamDownload file={exam} label="الموضوع" />}
        {solution && <ExamDownload file={solution} label="التصحيح" subtle />}
        {extras.map(file => (
          <ExamDownload key={file.id} file={file} label={TYPES[file.document_type] || "الملف"} subtle />
        ))}
      </div>
    </article>
  );
}
export default function ExamLibrary() {
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [competition, setCompetition] = useState(ALL);
  const [year, setYear] = useState(ALL);
  const [older, setOlder] = useState(false);
  const [shown, setShown] = useState(PAGE_SIZE);

  useEffect(() => {
    let active = true;
    async function loadDocuments() {
      try {
        const response = await fetch("/api/exam-documents", { cache: "no-store" });
        const payload = await response.json();
        if (!response.ok) throw new Error(payload.error || "تعذر تحميل الملفات.");
        if (!active) return;
        const items = Array.isArray(payload.documents) ? payload.documents : [];
        setDocuments(items);
        const initialCompetition = items.some(file => file.competition === "باكالوريا")
          ? "باكالوريا" : items[0]?.competition || ALL;
        setCompetition(initialCompetition);
        const newest = items.filter(file => file.competition === initialCompetition && file.year)
          .map(file => Number(file.year)).sort((a, b) => b - a)[0];
        setYear(newest ? String(newest) : ALL);
      } catch (cause) {
        if (active) setError(cause.message || "تعذر تحميل الملفات.");
      } finally {
        if (active) setLoading(false);
      }
    }
    loadDocuments();
    return () => { active = false; };
  }, []);

  const competitionCounts = useMemo(() => {
    const counts = new Map();
    for (const file of documents) counts.set(file.competition, (counts.get(file.competition) || 0) + 1);
    return [...counts].sort(([a], [b]) => COMPETITION_ORDER.indexOf(a) - COMPETITION_ORDER.indexOf(b));
  }, [documents]);
  const scoped = useMemo(() => documents.filter(file => competition === ALL || file.competition === competition), [documents, competition]);
  const years = useMemo(() => [...new Set(scoped.map(file => file.year).filter(Boolean).map(String))].sort((a, b) => Number(b) - Number(a)), [scoped]);
  const hasUndated = scoped.some(file => !file.year);
  const activeFiles = useMemo(() => scoped.filter(file => year === ALL || year === "undated" && !file.year || String(file.year) === year), [scoped, year]);
  const groups = useMemo(() => {
    const items = new Map();
    for (const file of activeFiles) {
      const key = sourceFileGroup(file);
      if (!items.has(key)) items.set(key, { key, year: file.year, competition: file.competition, session: file.session, subject: file.subject, branch: file.branch, documents: [] });
      items.get(key).documents.push(file);
    }
    return [...items.values()].sort((a, b) => Number(b.year || 0) - Number(a.year || 0) || String(a.subject).localeCompare(String(b.subject), "ar"));
  }, [activeFiles]);

  function chooseCompetition(value) {
    setCompetition(value);
    const relevant = documents.filter(file => value === ALL || file.competition === value);
    const newest = relevant.filter(file => file.year).map(file => Number(file.year)).sort((a, b) => b - a)[0];
    setYear(newest ? String(newest) : ALL);
    setOlder(false);
    setShown(PAGE_SIZE);
  }
  function chooseYear(value) { setYear(value); setShown(PAGE_SIZE); }

  if (loading) return (
    <div role="status" className="flex min-h-40 items-center justify-center gap-2 text-sm font-bold text-slate-600 dark:text-slate-300">
      <Loader2 className="h-5 w-5 animate-spin text-mauri-green" aria-hidden="true" />جاري تحميل الامتحانات…
    </div>
  );

  const chip = (active) => active
    ? "shrink-0 rounded-xl bg-mauri-green px-3 py-2.5 text-sm font-black text-white"
    : "shrink-0 rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm font-bold text-slate-700 transition hover:border-mauri-green/40 dark:border-white/10 dark:bg-[#12231a] dark:text-slate-200";

  return (
    <div className="space-y-4">
      {error && <p role="alert" className="rounded-xl bg-red-50 p-3 text-sm font-bold text-red-700 dark:bg-red-500/10 dark:text-red-300">{error}</p>}

      <section aria-label="المسابقة">
        <div className="flex snap-x gap-2 overflow-x-auto pb-2">
          {competitionCounts.map(([name, count]) => (
            <button key={name} type="button" onClick={() => chooseCompetition(name)} aria-pressed={competition === name}
              className={chip(competition === name) + " snap-start inline-flex min-h-12 items-center gap-2"}>
              <GraduationCap className="h-4 w-4" aria-hidden="true" />{name}
              <span className="text-xs opacity-70">{count}</span>
            </button>
          ))}
        </div>
      </section>

      <section aria-label="السنة" className="flex flex-wrap items-center gap-2">
        <span className="me-1 text-xs font-black text-slate-500 dark:text-slate-300">السنة</span>
        {years.slice(0, older ? undefined : OLDER_COUNT).map(value => (
          <button key={value} type="button" aria-pressed={year === value} onClick={() => chooseYear(value)} className={chip(year === value)}>
            {value}
          </button>
        ))}
        {hasUndated && <button type="button" aria-pressed={year === "undated"} onClick={() => chooseYear("undated")} className={chip(year === "undated")}>دون سنة</button>}
        {years.length > OLDER_COUNT && <button type="button" onClick={() => setOlder(v => !v)}
          className="inline-flex min-h-10 items-center gap-1 rounded-xl px-2 text-xs font-black text-mauri-green">
          {older ? "أقل" : "سنوات أقدم"}<ChevronDown className={older ? "h-4 w-4 rotate-180" : "h-4 w-4"} aria-hidden="true" />
        </button>}
      </section>

      <div className="flex items-center justify-between gap-3">
        <h2 className="text-base font-black text-slate-900 dark:text-white">
          {competition === ALL ? "الامتحانات" : competition}{year !== ALL ? ` · ${year === "undated" ? "دون سنة" : year}` : ""}
        </h2>
        <span aria-live="polite" className="text-xs font-bold text-slate-500 dark:text-slate-300">{groups.length} مادة</span>
      </div>
      {groups.length ? (
        <>
          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
            {groups.slice(0, shown).map(group => <SubjectCard key={group.key} group={group} />)}
          </div>
          {shown < groups.length && <button type="button" onClick={() => setShown(n => n + PAGE_SIZE)}
            className="mx-auto flex min-h-11 items-center justify-center rounded-xl border border-mauri-green px-5 text-sm font-black text-mauri-green">
            المزيد ({Math.min(PAGE_SIZE, groups.length - shown)})
          </button>}
        </>
      ) : (
        <div className="rounded-2xl border border-dashed border-slate-300 p-6 text-center text-sm font-semibold text-slate-500 dark:border-white/10 dark:text-slate-300">
          <BookOpen className="mx-auto mb-2 h-6 w-6" aria-hidden="true" />لا توجد ملفات لهذه السنة
        </div>
      )}
    </div>
  );
}
