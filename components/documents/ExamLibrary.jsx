"use client";

import { useEffect, useMemo, useState } from "react";
import {
  BookOpen,
  CheckCircle2,
  Download,
  FileText,
  GraduationCap,
  Layers3,
  Loader2,
  Search,
} from "lucide-react";

const ALL = "الكل";

const COMPETITION_ORDER = ["باكالوريا", "ابريفه", "كونكور", "الامتياز", "المعهد العالي"];
const TYPE_LABELS = {
  exam: "موضوع",
  solution: "حل",
  memo: "مذكرة",
  reference: "مرجع",
  bundle: "مجموعة ملفات",
};

function compareCompetition(a, b) {
  const first = COMPETITION_ORDER.indexOf(a);
  const second = COMPETITION_ORDER.indexOf(b);
  return (first === -1 ? 99 : first) - (second === -1 ? 99 : second) || a.localeCompare(b, "ar");
}

function yearLabel(year) {
  return year ? String(year) : "جميع السنوات";
}

function documentGroupKey(document) {
  return [
    document.competition,
    document.year || "all",
    document.session || "عادية",
    document.branch || "",
    document.subject,
  ].join("|");
}

function DownloadButton({ document, label, variant = "primary" }) {
  const styles =
    variant === "solution"
      ? "border-emerald-500/25 bg-emerald-500/10 text-emerald-700 hover:bg-emerald-500/20 dark:text-emerald-300"
      : variant === "secondary"
        ? "border-slate-200 bg-white text-slate-700 hover:border-mauri-green/40 hover:text-mauri-green dark:border-white/10 dark:bg-white/5 dark:text-slate-200"
        : "border-mauri-green bg-mauri-green text-white hover:bg-emerald-700";

  return (
    <a
      className={`inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border px-4 py-2 text-sm font-black transition active:scale-[.98] ${styles}`}
      download
      href={`/api/exam-documents/download?id=${document.id}`}
      aria-label={`${label}: ${document.title}`}
    >
      <Download className="h-4 w-4" aria-hidden="true" />
      {label}
    </a>
  );
}

function SubjectCard({ group }) {
  const exam = group.documents.find((document) => document.document_type === "exam");
  const solution = group.documents.find((document) => document.document_type === "solution");
  const extras = group.documents.filter(
    (document) => !["exam", "solution"].includes(document.document_type)
  );

  return (
    <article className="rounded-2xl border border-slate-200/80 bg-white/95 p-4 shadow-[0_12px_35px_rgba(15,23,42,.06)] transition hover:-translate-y-0.5 hover:border-mauri-green/30 hover:shadow-[0_18px_45px_rgba(15,118,110,.10)] dark:border-white/10 dark:bg-white/[.055]">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <span className="rounded-full bg-mauri-green/10 px-2.5 py-1 text-[11px] font-black text-mauri-green dark:text-emerald-300">
              {group.session || "عادية"}
            </span>
            {group.branch ? (
              <span className="rounded-full bg-slate-100 px-2.5 py-1 text-[11px] font-bold text-slate-600 dark:bg-white/10 dark:text-slate-300">
                {group.branch}
              </span>
            ) : null}
          </div>
          <h3 className="mt-3 text-lg font-black text-slate-950 dark:text-white">{group.subject}</h3>
          <p className="mt-1 text-xs font-semibold text-slate-500 dark:text-slate-400">
            المصدر: Rimbac — مستخدم بإذن صاحب الموقع
          </p>
        </div>
        <span className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-mauri-green/10 text-mauri-green dark:bg-emerald-300/10 dark:text-emerald-300">
          <FileText className="h-5 w-5" aria-hidden="true" />
        </span>
      </div>

      <div className="mt-4 grid grid-cols-1 gap-2 sm:grid-cols-2">
        {exam ? <DownloadButton document={exam} label="تحميل الموضوع" /> : null}
        {solution ? (
          <DownloadButton document={solution} label="تحميل الحل" variant="solution" />
        ) : exam ? (
          <span className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-dashed border-slate-200 px-3 py-2 text-xs font-bold text-slate-400 dark:border-white/10 dark:text-slate-500">
            <CheckCircle2 className="h-4 w-4" aria-hidden="true" />
            لا يوجد حل منشور
          </span>
        ) : null}
      </div>

      {extras.length ? (
        <div className="mt-3 grid gap-2">
          {extras.map((document) => (
            <DownloadButton
              document={document}
              key={document.id}
              label={`تحميل ${TYPE_LABELS[document.document_type] || "الملف"}`}
              variant="secondary"
            />
          ))}
        </div>
      ) : null}
    </article>
  );
}

export default function ExamLibrary() {
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [competition, setCompetition] = useState(ALL);
  const [branch, setBranch] = useState(ALL);
  const [year, setYear] = useState(ALL);
  const [kind, setKind] = useState(ALL);
  const [query, setQuery] = useState("");

  useEffect(() => {
    let active = true;

    async function loadDocuments() {
      try {
        setLoading(true);
        const response = await fetch("/api/exam-documents", { cache: "no-store" });
        const payload = await response.json();
        if (!response.ok) throw new Error(payload.error || "تعذر تحميل المكتبة.");
        if (active) setDocuments(Array.isArray(payload.documents) ? payload.documents : []);
      } catch (loadError) {
        if (active) setError(loadError.message || "تعذر تحميل المكتبة.");
      } finally {
        if (active) setLoading(false);
      }
    }

    loadDocuments();
    return () => {
      active = false;
    };
  }, []);

  const competitionCounts = useMemo(() => {
    const counts = new Map();
    documents.forEach((document) => {
      counts.set(document.competition, (counts.get(document.competition) || 0) + 1);
    });
    return [...counts.entries()].sort(([a], [b]) => compareCompetition(a, b));
  }, [documents]);

  const branches = useMemo(() => {
    const values = new Set(
      documents
        .filter((document) => competition === ALL || document.competition === competition)
        .map((document) => document.branch)
        .filter(Boolean)
    );
    return [...values].sort((a, b) => a.localeCompare(b, "ar"));
  }, [documents, competition]);

  const years = useMemo(() => {
    const values = new Set(
      documents
        .filter((document) => competition === ALL || document.competition === competition)
        .filter((document) => branch === ALL || document.branch === branch)
        .map((document) => document.year)
        .filter(Boolean)
    );
    return [...values].sort((a, b) => b - a);
  }, [documents, competition, branch]);

  const filtered = useMemo(() => {
    const needle = query.trim().toLocaleLowerCase("ar");
    return documents.filter((document) => {
      if (competition !== ALL && document.competition !== competition) return false;
      if (branch !== ALL && document.branch !== branch) return false;
      if (year !== ALL && String(document.year) !== year) return false;
      if (kind !== ALL && document.document_type !== kind) return false;
      if (!needle) return true;
      return [
        document.title,
        document.competition,
        document.subject,
        document.branch,
        document.session,
        document.year,
      ]
        .filter(Boolean)
        .join(" ")
        .toLocaleLowerCase("ar")
        .includes(needle);
    });
  }, [documents, competition, branch, year, kind, query]);

  const yearGroups = useMemo(() => {
    const map = new Map();
    filtered.forEach((document) => {
      const label = yearLabel(document.year);
      if (!map.has(label)) map.set(label, new Map());
      const groups = map.get(label);
      const key = documentGroupKey(document);
      if (!groups.has(key)) {
        groups.set(key, {
          key,
          subject: document.subject,
          branch: document.branch,
          session: document.session,
          documents: [],
        });
      }
      groups.get(key).documents.push(document);
    });

    return [...map.entries()]
      .sort(([a], [b]) => {
        if (a === "جميع السنوات") return 1;
        if (b === "جميع السنوات") return -1;
        return Number(b) - Number(a);
      })
      .map(([label, groups]) => ({
        label,
        groups: [...groups.values()].sort((a, b) => a.subject.localeCompare(b.subject, "ar")),
      }));
  }, [filtered]);

  function selectCompetition(value) {
    setCompetition(value);
    setBranch(ALL);
    setYear(ALL);
  }

  function selectBranch(value) {
    setBranch(value);
    setYear(ALL);
  }

  if (loading) {
    return (
      <div className="grid min-h-[380px] place-items-center rounded-3xl border border-slate-200 bg-white/80 dark:border-white/10 dark:bg-white/5">
        <div className="text-center">
          <Loader2 className="mx-auto h-9 w-9 animate-spin text-mauri-green" aria-hidden="true" />
          <p className="mt-3 font-black text-slate-700 dark:text-slate-200">جاري تحميل مكتبة المواضيع…</p>
        </div>
      </div>
    );
  }

  return (
    <div className="grid gap-6">
      {error ? (
        <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm font-bold text-red-700 dark:border-red-500/20 dark:bg-red-500/10 dark:text-red-300">
          {error}
        </div>
      ) : null}

      <section aria-label="اختيار المسابقة" className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-6">
        <button
          className={`rounded-2xl border p-4 text-right transition ${competition === ALL ? "border-mauri-green bg-mauri-green text-white shadow-lg shadow-emerald-900/15" : "border-slate-200 bg-white text-slate-800 hover:border-mauri-green/40 dark:border-white/10 dark:bg-white/5 dark:text-white"}`}
          onClick={() => selectCompetition(ALL)}
          type="button"
        >
          <Layers3 className="h-5 w-5" aria-hidden="true" />
          <strong className="mt-3 block text-sm">كل المسابقات</strong>
          <span className="mt-1 block text-xs opacity-75">{documents.length} ملفاً</span>
        </button>
        {competitionCounts.map(([name, count]) => (
          <button
            className={`rounded-2xl border p-4 text-right transition ${competition === name ? "border-mauri-green bg-mauri-green text-white shadow-lg shadow-emerald-900/15" : "border-slate-200 bg-white text-slate-800 hover:border-mauri-green/40 dark:border-white/10 dark:bg-white/5 dark:text-white"}`}
            key={name}
            onClick={() => selectCompetition(name)}
            type="button"
          >
            <GraduationCap className="h-5 w-5" aria-hidden="true" />
            <strong className="mt-3 block text-sm">{name}</strong>
            <span className="mt-1 block text-xs opacity-75">{count} ملفاً</span>
          </button>
        ))}
      </section>

      <section className="rounded-3xl border border-slate-200 bg-white/90 p-4 shadow-[0_15px_45px_rgba(15,23,42,.06)] dark:border-white/10 dark:bg-white/[.045] md:p-5">
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-5">
          <label className="relative xl:col-span-2">
            <span className="sr-only">البحث في المكتبة</span>
            <Search className="pointer-events-none absolute right-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" aria-hidden="true" />
            <input
              className="h-12 w-full rounded-xl border border-slate-200 bg-slate-50 pr-12 pl-4 text-sm font-bold text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-mauri-green focus:ring-4 focus:ring-mauri-green/10 dark:border-white/10 dark:bg-black/20 dark:text-white"
              onChange={(event) => setQuery(event.target.value)}
              placeholder="ابحث بالمادة أو السنة…"
              type="search"
              value={query}
            />
          </label>

          <select
            aria-label="الشعبة أو المستوى"
            className="h-12 rounded-xl border border-slate-200 bg-slate-50 px-3 text-sm font-black text-slate-800 outline-none focus:border-mauri-green dark:border-white/10 dark:bg-black/20 dark:text-white"
            onChange={(event) => selectBranch(event.target.value)}
            value={branch}
          >
            <option value={ALL}>كل الشعب والمستويات</option>
            {branches.map((item) => <option key={item} value={item}>{item}</option>)}
          </select>

          <select
            aria-label="السنة"
            className="h-12 rounded-xl border border-slate-200 bg-slate-50 px-3 text-sm font-black text-slate-800 outline-none focus:border-mauri-green dark:border-white/10 dark:bg-black/20 dark:text-white"
            onChange={(event) => setYear(event.target.value)}
            value={year}
          >
            <option value={ALL}>كل السنوات</option>
            {years.map((item) => <option key={item} value={String(item)}>{item}</option>)}
          </select>

          <select
            aria-label="نوع الملف"
            className="h-12 rounded-xl border border-slate-200 bg-slate-50 px-3 text-sm font-black text-slate-800 outline-none focus:border-mauri-green dark:border-white/10 dark:bg-black/20 dark:text-white"
            onChange={(event) => setKind(event.target.value)}
            value={kind}
          >
            <option value={ALL}>المواضيع والحلول والمراجع</option>
            <option value="exam">المواضيع فقط</option>
            <option value="solution">الحلول فقط</option>
            <option value="memo">المذكرات فقط</option>
            <option value="reference">المراجع فقط</option>
            <option value="bundle">مجموعات الملفات</option>
          </select>
        </div>

        <div className="mt-4 flex flex-wrap items-center justify-between gap-2 border-t border-slate-100 pt-4 text-xs font-bold text-slate-500 dark:border-white/10 dark:text-slate-400">
          <span>تم العثور على {filtered.length} ملفاً</span>
          <span>الضغط على زر التحميل يبدأ التنزيل مباشرة</span>
        </div>
      </section>

      {yearGroups.length ? (
        yearGroups.map((yearGroup) => (
          <section className="grid gap-4" key={yearGroup.label}>
            <header className="flex items-center gap-3">
              <span className="grid h-11 min-w-16 place-items-center rounded-2xl bg-mauri-green text-base font-black text-white shadow-lg shadow-emerald-900/15">
                {yearGroup.label}
              </span>
              <div className="h-px flex-1 bg-gradient-to-l from-slate-200 to-transparent dark:from-white/15" />
              <span className="text-xs font-black text-slate-500 dark:text-slate-400">{yearGroup.groups.length} مادة</span>
            </header>
            <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
              {yearGroup.groups.map((group) => <SubjectCard group={group} key={group.key} />)}
            </div>
          </section>
        ))
      ) : (
        <div className="grid min-h-[260px] place-items-center rounded-3xl border border-dashed border-slate-300 bg-white/70 p-8 text-center dark:border-white/15 dark:bg-white/[.035]">
          <div>
            <BookOpen className="mx-auto h-10 w-10 text-slate-400" aria-hidden="true" />
            <h2 className="mt-3 text-lg font-black text-slate-800 dark:text-white">لا توجد ملفات مطابقة</h2>
            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">غيّر الشعبة أو السنة أو المسابقة أو كلمات البحث.</p>
          </div>
        </div>
      )}
    </div>
  );
}
