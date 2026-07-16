"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";

function normalizeDigits(value) {
  return String(value || "")
    .replace(/[٠-٩]/g, (digit) => String("٠١٢٣٤٥٦٧٨٩".indexOf(digit)))
    .replace(/\D/g, "")
    .slice(0, 14);
}

function formatNumber(value, maximumFractionDigits = 2) {
  if (typeof value !== "number" || !Number.isFinite(value)) return "—";
  return new Intl.NumberFormat("fr-FR", { maximumFractionDigits }).format(value);
}

function formatDate(value) {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return String(value);
  return new Intl.DateTimeFormat("ar-MR", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(date);
}

function getGradeMeta(score) {
  if (typeof score !== "number" || score < 0) {
    return {
      label: "غير محتسب",
      text: "text-slate-600 dark:text-slate-300",
      badge: "bg-slate-100 ring-slate-200 dark:bg-white/10 dark:ring-white/10",
      bar: "bg-slate-300 dark:bg-slate-600",
      dot: "bg-slate-400",
      percent: 0,
    };
  }

  const percent = Math.max(0, Math.min(100, (score / 20) * 100));
  if (score >= 10) {
    return {
      label: "ناجح في المادة",
      text: "text-emerald-700 dark:text-emerald-300",
      badge: "bg-emerald-50 ring-emerald-200 dark:bg-emerald-300/10 dark:ring-emerald-300/20",
      bar: "bg-emerald-500",
      dot: "bg-emerald-500",
      percent,
    };
  }
  if (score >= 8) {
    return {
      label: "قريب من النجاح",
      text: "text-amber-700 dark:text-amber-300",
      badge: "bg-amber-50 ring-amber-200 dark:bg-amber-300/10 dark:ring-amber-300/20",
      bar: "bg-amber-500",
      dot: "bg-amber-500",
      percent,
    };
  }
  return {
    label: "يحتاج تحسين",
    text: "text-rose-700 dark:text-rose-300",
    badge: "bg-rose-50 ring-rose-200 dark:bg-rose-300/10 dark:ring-rose-300/20",
    bar: "bg-rose-500",
    dot: "bg-rose-500",
    percent,
  };
}

function SearchIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
      <circle cx="11" cy="11" r="7" />
      <path d="m20 20-3.4-3.4" />
    </svg>
  );
}

function ArrowRightIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
      <path d="M19 12H5" />
      <path d="m12 19-7-7 7-7" />
    </svg>
  );
}

function StatCard({ label, value, hint, emphasize = false }) {
  return (
    <div className={`min-w-0 rounded-[18px] border p-3 ${emphasize ? "border-emerald-200 bg-emerald-50/90 dark:border-emerald-300/20 dark:bg-emerald-300/10" : "border-slate-200 bg-slate-50/80 dark:border-white/10 dark:bg-white/[.04]"}`}>
      <span className="block text-[10px] font-black text-slate-500 dark:text-slate-400">{label}</span>
      <strong className={`mt-1 block truncate font-black ${emphasize ? "text-2xl text-emerald-700 dark:text-emerald-300" : "text-base text-slate-950 dark:text-white"}`}>{value || "—"}</strong>
      {hint ? <small className="mt-1 block truncate text-[9px] font-bold text-slate-400 dark:text-slate-500">{hint}</small> : null}
    </div>
  );
}

function SubjectRow({ subject, index }) {
  const meta = getGradeMeta(subject.score);
  const unavailable = typeof subject.score !== "number" || subject.score < 0;
  const nameAr = subject.nameAr || subject.nameFr || `المادة ${index + 1}`;
  const nameFr = subject.nameFr && subject.nameFr !== subject.nameAr ? subject.nameFr : "";

  return (
    <article className="group relative px-3 py-3.5 transition-colors hover:bg-slate-50/80 dark:hover:bg-white/[.025] sm:px-5">
      <div className="grid grid-cols-[minmax(0,1fr)_76px] items-center gap-3 sm:grid-cols-[minmax(0,1fr)_92px]">
        <div className="min-w-0">
          <div className="flex min-w-0 items-start gap-2.5">
            <span className={`mt-1.5 h-2.5 w-2.5 shrink-0 rounded-full ${meta.dot}`} aria-hidden="true" />
            <div className="min-w-0 flex-1">
              <h3 className="text-[13px] font-black leading-5 text-slate-950 dark:text-white sm:text-sm">{nameAr}</h3>
              <div className="mt-1 flex min-w-0 flex-wrap items-center gap-x-2 gap-y-1 text-[9px] font-bold sm:text-[10px]">
                {nameFr ? <span className="max-w-full truncate text-slate-500 dark:text-slate-400" dir="ltr">{nameFr}</span> : null}
                <span className="rounded-full bg-slate-100 px-2 py-0.5 text-slate-600 dark:bg-white/10 dark:text-slate-300">المعامل {formatNumber(subject.coefficient, 0)}</span>
                <span className={meta.text}>{meta.label}</span>
              </div>
            </div>
          </div>

          <div className="mt-2.5 mr-5 h-1.5 overflow-hidden rounded-full bg-slate-100 dark:bg-white/10">
            <div className={`h-full rounded-full transition-all duration-500 ${meta.bar}`} style={{ width: `${meta.percent}%` }} />
          </div>
        </div>

        <div className={`flex min-h-[58px] flex-col items-center justify-center rounded-[16px] px-2 text-center ring-1 ${meta.badge}`}>
          <strong className={`text-lg font-black leading-none ${meta.text}`}>{unavailable ? "—" : formatNumber(subject.score)}</strong>
          <small className={`mt-1 text-[9px] font-black ${meta.text}`}>{unavailable ? "معفى" : "من 20"}</small>
        </div>
      </div>
    </article>
  );
}

function LoadingState() {
  return (
    <div className="overflow-hidden rounded-[26px] border border-slate-200 bg-white shadow-sm dark:border-white/10 dark:bg-[#0c1c13]">
      <div className="h-44 animate-pulse bg-slate-200/75 dark:bg-white/10" />
      <div className="divide-y divide-slate-100 dark:divide-white/10">
        {Array.from({ length: 8 }).map((_, index) => (
          <div key={index} className="flex items-center gap-3 px-4 py-4">
            <div className="h-3 w-3 animate-pulse rounded-full bg-slate-200 dark:bg-white/10" />
            <div className="min-w-0 flex-1 space-y-2">
              <div className="h-4 w-2/3 animate-pulse rounded bg-slate-200 dark:bg-white/10" />
              <div className="h-2 w-full animate-pulse rounded bg-slate-100 dark:bg-white/5" />
            </div>
            <div className="h-14 w-16 animate-pulse rounded-2xl bg-slate-200 dark:bg-white/10" />
          </div>
        ))}
      </div>
    </div>
  );
}

function ResultsCard({ data }) {
  const candidate = data?.candidate || {};
  const subjects = Array.isArray(data?.subjects) ? data.subjects : [];
  const name = candidate.nameAr || candidate.nameFr || "المترشح";
  const centre = candidate.centreAr || candidate.centreFr || "—";
  const passedSubjects = subjects.filter((subject) => typeof subject.score === "number" && subject.score >= 10).length;
  const countedSubjects = subjects.filter((subject) => typeof subject.score === "number" && subject.score >= 0).length;
  const totalCoefficients = subjects.reduce((sum, subject) => sum + (typeof subject.coefficient === "number" ? subject.coefficient : 0), 0);

  return (
    <section className="overflow-hidden rounded-[28px] border border-slate-200/90 bg-white shadow-[0_22px_65px_rgba(15,23,42,.10)] dark:border-white/10 dark:bg-[#0c1c13]">
      <div className="relative overflow-hidden bg-gradient-to-br from-[#063d28] via-[#087047] to-[#19a468] p-4 text-white sm:p-6">
        <div className="absolute -left-14 -top-14 h-40 w-40 rounded-full bg-white/10 blur-2xl" aria-hidden="true" />
        <div className="absolute -bottom-16 right-10 h-36 w-36 rounded-full bg-emerald-300/15 blur-2xl" aria-hidden="true" />

        <div className="relative flex items-start justify-between gap-3">
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2 text-[10px] font-black text-emerald-100">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-white/12 px-2.5 py-1 ring-1 ring-white/15">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-300" />
                كشف رسمي
              </span>
              <span>{subjects.length} مواد</span>
            </div>
            <h1 className="mt-3 break-words text-xl font-black leading-8 sm:text-2xl">{name}</h1>
            <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] font-bold text-emerald-100 sm:text-xs">
              <span>رقم المترشح: <b className="text-white" dir="ltr">{candidate.number || "—"}</b></span>
              <span>تاريخ الميلاد: <b className="text-white">{formatDate(candidate.birthDate)}</b></span>
            </div>
          </div>
          <span className="grid h-12 w-12 shrink-0 place-items-center rounded-[18px] bg-white/14 text-2xl ring-1 ring-white/20" aria-hidden="true">🎓</span>
        </div>

        <div className="relative mt-4 flex min-w-0 items-center gap-2 rounded-2xl bg-black/10 px-3 py-2.5 ring-1 ring-white/10">
          <span className="shrink-0" aria-hidden="true">📍</span>
          <span className="min-w-0 truncate text-[11px] font-bold text-emerald-50 sm:text-xs">{centre}</span>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2 border-b border-slate-200 bg-white p-3 dark:border-white/10 dark:bg-[#0c1c13] sm:grid-cols-4 sm:p-4">
        <StatCard label="المعدل" value={formatNumber(candidate.average)} hint="من 20" emphasize />
        <StatCard label="القرار" value={candidate.decision} hint="النتيجة الرسمية" />
        <StatCard label="المواد الناجحة" value={`${passedSubjects} / ${countedSubjects || subjects.length}`} hint="درجة 10 فأكثر" />
        <StatCard label="مجموع المعاملات" value={formatNumber(totalCoefficients, 0)} hint={candidate.series || "البريفيه"} />
      </div>

      <div className="flex items-center justify-between gap-3 border-b border-slate-200 bg-slate-50/80 px-3 py-3 dark:border-white/10 dark:bg-white/[.035] sm:px-5">
        <div>
          <p className="text-[9px] font-black text-emerald-700 dark:text-emerald-300">التفاصيل الكاملة</p>
          <h2 className="text-base font-black text-slate-950 dark:text-white sm:text-lg">درجات المواد</h2>
        </div>
        <div className="flex items-center gap-2 text-[9px] font-black sm:text-[10px]">
          <span className="inline-flex items-center gap-1 text-emerald-700 dark:text-emerald-300"><i className="h-2 w-2 rounded-full bg-emerald-500" />ناجح</span>
          <span className="inline-flex items-center gap-1 text-amber-700 dark:text-amber-300"><i className="h-2 w-2 rounded-full bg-amber-500" />قريب</span>
          <span className="inline-flex items-center gap-1 text-rose-700 dark:text-rose-300"><i className="h-2 w-2 rounded-full bg-rose-500" />منخفض</span>
        </div>
      </div>

      {subjects.length ? (
        <div className="divide-y divide-slate-100 dark:divide-white/10">
          {subjects.map((subject, index) => (
            <SubjectRow key={`${subject.nameAr || subject.nameFr}-${index}`} subject={subject} index={index} />
          ))}
        </div>
      ) : (
        <div className="p-8 text-center">
          <span className="text-3xl" aria-hidden="true">📄</span>
          <p className="mt-3 text-sm font-black text-slate-700 dark:text-slate-200">بيانات المترشح موجودة، لكن درجات المواد غير متاحة حاليًا.</p>
        </div>
      )}

      <footer className="border-t border-slate-100 bg-slate-50/70 px-4 py-3 text-center text-[9px] font-bold leading-5 text-slate-500 dark:border-white/10 dark:bg-white/[.025] dark:text-slate-400 sm:text-[10px]">
        المصدر: منصة إدارة الامتحانات والمسابقات الرسمية — يعرض MauriResults البيانات دون تعديل.
      </footer>
    </section>
  );
}

export default function BepcSubjectsPageClient({ initialNumber = "" }) {
  const [number, setNumber] = useState(() => normalizeDigits(initialNumber));
  const [status, setStatus] = useState("idle");
  const [data, setData] = useState(null);
  const [error, setError] = useState("");
  const requestRef = useRef(null);
  const autoSearchedRef = useRef(false);
  const cleanNumber = useMemo(() => normalizeDigits(number), [number]);

  const runSearch = useCallback(async (candidateNumber, { updateUrl = true } = {}) => {
    const normalized = normalizeDigits(candidateNumber);
    if (!normalized) {
      setStatus("error");
      setError("أدخل رقم المترشح أولًا.");
      return;
    }

    requestRef.current?.abort();
    const controller = new AbortController();
    requestRef.current = controller;
    setStatus("loading");
    setError("");
    setData(null);

    if (updateUrl && typeof window !== "undefined") {
      const url = new URL(window.location.href);
      url.searchParams.set("number", normalized);
      window.history.replaceState({}, "", url);
    }

    try {
      const response = await fetch(`/api/bepc-subject-details?number=${encodeURIComponent(normalized)}`, {
        headers: { accept: "application/json" },
        signal: controller.signal,
      });
      const payload = await response.json().catch(() => null);
      if (!response.ok || !payload?.ok) {
        throw new Error(payload?.message || "تعذر العثور على تفاصيل المواد لهذا الرقم.");
      }
      setData(payload);
      setStatus("success");
    } catch (searchError) {
      if (searchError?.name === "AbortError") return;
      setStatus("error");
      setError(searchError instanceof Error ? searchError.message : "تعذر الاتصال بالخدمة.");
    }
  }, []);

  useEffect(() => {
    if (!initialNumber || autoSearchedRef.current) return;
    autoSearchedRef.current = true;
    void runSearch(initialNumber, { updateUrl: false });
  }, [initialNumber, runSearch]);

  useEffect(() => () => requestRef.current?.abort(), []);

  function handleSubmit(event) {
    event.preventDefault();
    void runSearch(cleanNumber);
  }

  function goBack() {
    if (window.history.length > 1) window.history.back();
    else window.location.assign("/");
  }

  return (
    <main dir="rtl" className="min-h-[100dvh] bg-[#f3f7f4] text-slate-950 dark:bg-[#061109] dark:text-white">
      <div className="pointer-events-none fixed inset-x-0 top-0 h-72 bg-gradient-to-b from-emerald-100/70 to-transparent dark:from-emerald-950/40" aria-hidden="true" />

      <header className="sticky top-0 z-30 border-b border-white/70 bg-white/85 backdrop-blur-xl dark:border-white/10 dark:bg-[#07130d]/88">
        <div className="mx-auto flex min-h-[64px] max-w-3xl items-center justify-between gap-3 px-3 pt-[env(safe-area-inset-top)] sm:px-5">
          <button type="button" onClick={goBack} className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl border border-slate-200 bg-white text-slate-700 shadow-sm transition active:scale-95 dark:border-white/10 dark:bg-white/[.06] dark:text-white" aria-label="رجوع">
            <ArrowRightIcon />
          </button>
          <div className="min-w-0 flex-1 text-center">
            <p className="text-[9px] font-black text-emerald-700 dark:text-emerald-300">البريفيه</p>
            <h1 className="truncate text-base font-black sm:text-lg">تفاصيل درجات المواد</h1>
          </div>
          <div className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-emerald-100 text-xl dark:bg-emerald-300/10" aria-hidden="true">📚</div>
        </div>
      </header>

      <div className="relative mx-auto w-full max-w-3xl px-3 py-4 pb-10 sm:px-5 sm:py-6">
        <section className="mb-4 rounded-[24px] border border-white/80 bg-white/92 p-3 shadow-[0_16px_45px_rgba(15,23,42,.07)] backdrop-blur dark:border-white/10 dark:bg-[#0c1c13]/92 sm:p-4">
          <div className="mb-3 px-1">
            <h2 className="text-lg font-black text-slate-950 dark:text-white">ابحث برقم المترشح</h2>
            <p className="mt-1 text-[11px] font-bold leading-5 text-slate-500 dark:text-slate-400">سيتم عرض بيانات المترشح وجميع درجات المواد في صفحة واحدة واضحة.</p>
          </div>

          <form onSubmit={handleSubmit} className="grid grid-cols-[minmax(0,1fr)_92px] gap-2 sm:grid-cols-[minmax(0,1fr)_120px]">
            <label htmlFor="bepc-subject-number" className="sr-only">رقم المترشح</label>
            <div className="relative min-w-0">
              <span className="pointer-events-none absolute inset-y-0 right-4 grid place-items-center text-slate-400"><SearchIcon /></span>
              <input
                id="bepc-subject-number"
                type="text"
                inputMode="numeric"
                autoComplete="off"
                value={number}
                onChange={(event) => setNumber(normalizeDigits(event.target.value))}
                placeholder="مثال: 75457"
                className="h-13 min-h-[52px] w-full min-w-0 rounded-[17px] border border-slate-200 bg-slate-50 pr-12 pl-3 text-base font-black text-slate-950 outline-none transition placeholder:text-sm placeholder:font-bold placeholder:text-slate-400 focus:border-emerald-500 focus:bg-white focus:ring-4 focus:ring-emerald-500/10 dark:border-white/10 dark:bg-white/[.05] dark:text-white"
              />
            </div>
            <button type="submit" disabled={status === "loading" || !cleanNumber} className="min-h-[52px] rounded-[17px] bg-gradient-to-l from-[#087047] to-[#19a468] px-4 text-sm font-black text-white shadow-[0_14px_30px_rgba(5,150,105,.22)] transition active:scale-[.98] disabled:pointer-events-none disabled:opacity-50">
              {status === "loading" ? "جاري البحث" : "بحث"}
            </button>
          </form>
        </section>

        <div aria-live="polite">
          {status === "idle" ? (
            <section className="grid min-h-[46dvh] place-items-center rounded-[26px] border border-dashed border-emerald-200 bg-white/70 p-7 text-center dark:border-emerald-300/15 dark:bg-white/[.03]">
              <div className="max-w-sm">
                <span className="mx-auto grid h-16 w-16 place-items-center rounded-[22px] bg-emerald-100 text-3xl dark:bg-emerald-300/10" aria-hidden="true">🔎</span>
                <h2 className="mt-4 text-lg font-black">كشف المواد الكامل</h2>
                <p className="mt-2 text-sm font-bold leading-6 text-slate-500 dark:text-slate-400">أدخل رقم المترشح وسيظهر الكشف الرسمي في نفس الصفحة بتصميم مناسب للهاتف.</p>
              </div>
            </section>
          ) : null}

          {status === "loading" ? <LoadingState /> : null}

          {status === "error" ? (
            <section className="grid min-h-[42dvh] place-items-center rounded-[26px] border border-rose-200 bg-white p-7 text-center shadow-sm dark:border-rose-300/15 dark:bg-[#0c1c13]">
              <div className="max-w-sm">
                <span className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-rose-100 text-2xl dark:bg-rose-300/10" aria-hidden="true">⚠️</span>
                <h2 className="mt-4 text-base font-black">تعذر عرض الكشف</h2>
                <p className="mt-2 text-sm font-bold leading-6 text-rose-700 dark:text-rose-200">{error}</p>
                <button type="button" onClick={() => void runSearch(cleanNumber)} disabled={!cleanNumber} className="mt-4 rounded-2xl bg-rose-100 px-5 py-2.5 text-xs font-black text-rose-700 transition active:scale-95 disabled:opacity-50 dark:bg-rose-300/10 dark:text-rose-200">إعادة المحاولة</button>
              </div>
            </section>
          ) : null}

          {status === "success" && data ? <ResultsCard data={data} /> : null}
        </div>
      </div>
    </main>
  );
}
