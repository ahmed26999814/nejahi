"use client";

import { useEffect, useMemo, useState } from "react";
import { ArrowRight, BookOpen, ChevronDown, Download, FileText, GraduationCap, Loader2 } from "lucide-react";

const ORDER = ["باكالوريا", "ابريفه", "كونكور", "الامتياز", "المعهد العالي"];
const PAGE = 24;
const TYPES = { exam: "الموضوع", solution: "التصحيح", memo: "المذكرة", reference: "المرجع", bundle: "المجموعة" };

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
        {extras.map(file => <ExamDownload key={file.id} file={file} label={TYPES[file.document_type] || "الملف"} subtle />)}
      </div>
    </article>
  );
}
function ChoiceCard({ title, count, onClick, Icon = GraduationCap }) {
  return (
    <button type="button" onClick={onClick}
      className="flex min-h-[92px] min-w-0 items-center gap-3 rounded-2xl border border-slate-200 bg-white p-4 text-start shadow-sm transition hover:border-mauri-green/40 hover:bg-emerald-50/40 active:scale-[.99] dark:border-white/10 dark:bg-[#12231a] dark:hover:bg-emerald-500/10">
      <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-mauri-green/10 text-mauri-green dark:text-emerald-300">
        <Icon className="h-5 w-5" aria-hidden="true" />
      </span>
      <span className="min-w-0 flex-1">
        <strong className="block text-sm font-black text-slate-900 dark:text-white">{title}</strong>
        <span className="mt-1 block text-xs font-semibold text-slate-500 dark:text-slate-300">{count}</span>
      </span>
    </button>
  );
}
export default function ExamLibrary() {
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [competition, setCompetition] = useState("");
  const [year, setYear] = useState("");
  const [showOlder, setShowOlder] = useState(false);
  const [shown, setShown] = useState(PAGE);

  useEffect(() => {
    let active = true;
    async function fetchDocuments() {
      try {
        const response = await fetch("/api/exam-documents", { cache: "no-store" });
        const result = await response.json();
        if (!response.ok) throw new Error(result.error || "تعذر تحميل الامتحانات.");
        if (active) setDocuments(Array.isArray(result.documents) ? result.documents : []);
      } catch (cause) {
        if (active) setError(cause.message || "تعذر تحميل الامتحانات.");
      } finally {
        if (active) setLoading(false);
      }
    }
    fetchDocuments();
    return () => { active = false; };
  }, []);

  const options = useMemo(() => {
    const counts = new Map();
    for (const document of documents) {
      counts.set(document.competition, (counts.get(document.competition) || 0) + 1);
    }
    return [...counts.entries()].sort(([a], [b]) => {
      const ai = ORDER.indexOf(a), bi = ORDER.indexOf(b);
      return (ai < 0 ? 99 : ai) - (bi < 0 ? 99 : bi);
    });
  }, [documents]);
  const scoped = useMemo(() => documents.filter(file => file.competition === competition), [documents, competition]);
  const years = useMemo(() => [...new Set(scoped.map(file => file.year).filter(Boolean).map(String))].sort((a, b) => Number(b) - Number(a)), [scoped]);
  const undated = scoped.some(file => !file.year);
  const groups = useMemo(() => {
    const map = new Map();
    for (const file of scoped) {
      if (year === "undated" ? Boolean(file.year) : String(file.year) !== year) continue;
      const key = [file.competition, file.year || "", file.session || "", file.branch || "", file.subject].join("|");
      if (!map.has(key)) map.set(key, { key, subject: file.subject, branch: file.branch, session: file.session, documents: [] });
      map.get(key).documents.push(file);
    }
    return [...map.values()].sort((a, b) => String(a.subject).localeCompare(String(b.subject), "ar"));
  }, [scoped, year]);

  function back() {
    if (year) { setYear(""); setShown(PAGE); return; }
    setCompetition("");
    setShowOlder(false);
  }

  if (loading) return <div role="status" className="flex min-h-32 items-center justify-center gap-2 text-sm font-semibold text-slate-500 dark:text-slate-300">
    <Loader2 className="h-5 w-5 animate-spin text-mauri-green" />جاري تحميل الملفات…
  </div>;

  return (
    <div className="space-y-4">
      {error && <p role="alert" className="rounded-xl bg-red-50 p-3 text-sm font-bold text-red-700 dark:bg-red-500/10 dark:text-red-300">{error}</p>}
      <div className="flex items-center justify-between gap-3">
        <div className="min-w-0">
          <h2 className="text-lg font-black text-slate-900 dark:text-white">
            {!competition ? "اختر الامتحان" : !year ? "اختر السنة" : `${competition} · ${year === "undated" ? "دون سنة" : year}`}
          </h2>
          {competition && <p className="mt-1 text-xs font-semibold text-slate-500 dark:text-slate-300">{competition}{year ? ` / ${year === "undated" ? "دون سنة" : year}` : ""}</p>}
        </div>
        {competition && <button type="button" onClick={back}
          className="inline-flex min-h-10 shrink-0 items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 text-sm font-black text-mauri-green dark:border-white/10 dark:bg-[#12231a]">
          <ArrowRight className="h-4 w-4" aria-hidden="true" />رجوع
        </button>}
      </div>

      {!competition ? (
        <section aria-label="المسابقات" className="grid grid-cols-2 gap-3 md:grid-cols-3">
          {options.map(([name, count]) => <ChoiceCard key={name} title={name} count={count}
            onClick={() => { setCompetition(name); setYear(""); setShowOlder(false); setShown(PAGE); }} />)}
        </section>
      ) : !year ? (
        <section aria-label="السنوات" className="grid grid-cols-2 gap-3 md:grid-cols-3">
          {years.slice(0, showOlder ? undefined : 8).map(value => (
            <ChoiceCard key={value} title={value} count={scoped.filter(file => String(file.year) === value).length}
              Icon={BookOpen} onClick={() => { setYear(value); setShown(PAGE); }} />
          ))}
          {undated && <ChoiceCard title="دون سنة" count={scoped.filter(file => !file.year).length}
            Icon={BookOpen} onClick={() => { setYear("undated"); setShown(PAGE); }} />}
          {years.length > 8 && <button type="button" onClick={() => setShowOlder(value => !value)}
            className="flex min-h-[92px] items-center justify-center gap-2 rounded-2xl border border-dashed border-mauri-green/40 bg-white p-3 text-sm font-black text-mauri-green dark:bg-[#12231a]">
            <ChevronDown className={showOlder ? "h-4 w-4 rotate-180" : "h-4 w-4"} />{showOlder ? "أقل" : "سنوات أقدم"}
          </button>}
        </section>
      ) : (
        <section aria-label="المواضيع">
          <p aria-live="polite" className="mb-3 text-xs font-semibold text-slate-500 dark:text-slate-300">{groups.length} مادة</p>
          {groups.length ? (
            <>
              <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
                {groups.slice(0, shown).map(group => <SubjectCard key={group.key} group={group} />)}
              </div>
              {shown < groups.length && <button type="button" onClick={() => setShown(value => value + PAGE)}
                className="mx-auto mt-4 flex min-h-11 items-center rounded-xl border border-mauri-green px-5 text-sm font-black text-mauri-green">
                عرض المزيد
              </button>}
            </>
          ) : <div className="rounded-xl border border-dashed border-slate-200 p-6 text-sm text-slate-500 dark:border-white/10">لا توجد ملفات لهذه السنة.</div>}
        </section>
      )}
    </div>
  );
}
