"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";

const OPEN_SUBJECT_DETAILS_EVENT = "mauriresults:open-subject-details";

function normalizeDigits(value) {
  return String(value || "")
    .replace(/[٠-٩]/g, (digit) => String("٠١٢٣٤٥٦٧٨٩".indexOf(digit)))
    .replace(/\D/g, "")
    .slice(0, 14);
}

function formatNumber(value, digits = 2) {
  if (typeof value !== "number" || !Number.isFinite(value)) return "—";
  return new Intl.NumberFormat("ar-MR", { maximumFractionDigits: digits }).format(value);
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

function scoreStyle(score) {
  if (typeof score !== "number" || score < 0) {
    return {
      dot: "bg-slate-300 dark:bg-slate-600",
      score: "bg-slate-100 text-slate-600 ring-slate-200 dark:bg-white/10 dark:text-slate-300 dark:ring-white/10",
      label: "غير محتسب",
      labelClass: "text-slate-500 dark:text-slate-400",
    };
  }

  if (score >= 10) {
    return {
      dot: "bg-emerald-500",
      score: "bg-emerald-50 text-emerald-800 ring-emerald-200 dark:bg-emerald-300/15 dark:text-emerald-200 dark:ring-emerald-300/20",
      label: "جيد",
      labelClass: "text-emerald-700 dark:text-emerald-300",
    };
  }

  if (score >= 8) {
    return {
      dot: "bg-amber-400",
      score: "bg-amber-50 text-amber-800 ring-amber-200 dark:bg-amber-300/15 dark:text-amber-200 dark:ring-amber-300/20",
      label: "قريب من النجاح",
      labelClass: "text-amber-700 dark:text-amber-300",
    };
  }

  return {
    dot: "bg-rose-500",
    score: "bg-rose-50 text-rose-800 ring-rose-200 dark:bg-rose-300/15 dark:text-rose-200 dark:ring-rose-300/20",
    label: "يحتاج تحسين",
    labelClass: "text-rose-700 dark:text-rose-300",
  };
}

function SummaryItem({ label, value, accent = false }) {
  return (
    <div className="min-w-0 rounded-2xl bg-white/10 px-3 py-2.5 ring-1 ring-white/10">
      <span className="block text-[9px] font-black text-emerald-100">{label}</span>
      <strong className={`mt-1 block truncate font-black ${accent ? "text-xl" : "text-xs"}`}>{value || "—"}</strong>
    </div>
  );
}

function SearchState({ status, error }) {
  if (status === "loading") {
    return (
      <div className="space-y-2 px-3 py-4 sm:px-5 sm:py-5">
        <div className="h-44 animate-pulse rounded-[24px] bg-slate-200/75 dark:bg-white/10" />
        <div className="overflow-hidden rounded-[24px] border border-slate-200 bg-white dark:border-white/10 dark:bg-white/[.04]">
          {Array.from({ length: 6 }).map((_, index) => (
            <div key={index} className="flex items-center gap-3 border-b border-slate-100 px-3 py-3 last:border-0 dark:border-white/10 sm:px-4">
              <div className="h-3 w-3 animate-pulse rounded-full bg-slate-200 dark:bg-white/10" />
              <div className="h-4 flex-1 animate-pulse rounded bg-slate-200 dark:bg-white/10" />
              <div className="h-10 w-16 animate-pulse rounded-xl bg-slate-200 dark:bg-white/10" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (status === "error") {
    return (
      <div className="grid min-h-[45dvh] place-items-center px-5 py-10 text-center">
        <div className="max-w-sm">
          <span className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-rose-100 text-2xl dark:bg-rose-300/10" aria-hidden="true">
            ⚠️
          </span>
          <h3 className="mt-4 text-base font-black text-slate-900 dark:text-white">تعذر عرض تفاصيل المواد</h3>
          <p className="mt-2 text-sm font-bold leading-6 text-rose-700 dark:text-rose-200">{error}</p>
          <p className="mt-1 text-xs font-bold text-slate-500 dark:text-slate-400">تأكد من رقم المترشح ثم أعد البحث.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="grid min-h-[48dvh] place-items-center px-5 py-10 text-center">
      <div className="max-w-sm">
        <span className="mx-auto grid h-16 w-16 place-items-center rounded-[22px] bg-mauri-green/10 text-3xl dark:bg-emerald-300/10" aria-hidden="true">
          📚
        </span>
        <h3 className="mt-4 text-lg font-black text-slate-900 dark:text-white">درجات جميع المواد في واجهة واحدة</h3>
        <p className="mt-2 text-sm font-bold leading-6 text-slate-500 dark:text-slate-400">
          أدخل رقم المترشح في الأعلى لعرض الكشف الرسمي المتوافق مع الهاتف.
        </p>
      </div>
    </div>
  );
}

function ResultView({ data }) {
  const candidate = data?.candidate || {};
  const subjects = Array.isArray(data?.subjects) ? data.subjects : [];
  const name = candidate.nameAr || candidate.nameFr || "المترشح";
  const centre = candidate.centreAr || candidate.centreFr || "—";

  return (
    <div className="px-3 pb-[max(1rem,env(safe-area-inset-bottom))] pt-3 sm:px-5 sm:pb-5">
      <section className="overflow-hidden rounded-[26px] border border-slate-200/90 bg-white shadow-[0_18px_48px_rgba(15,23,42,.10)] dark:border-white/10 dark:bg-[#0d1f16]">
        <div className="bg-gradient-to-br from-emerald-950 via-emerald-800 to-emerald-600 p-4 text-white sm:p-5">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2 text-[10px] font-black text-emerald-100">
                <span className="inline-flex items-center gap-1.5 rounded-full bg-white/12 px-2.5 py-1 ring-1 ring-white/15">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-300" />
                  بيانات رسمية
                </span>
                <span>{subjects.length} مواد</span>
              </div>
              <h3 className="mt-2 break-words text-lg font-black leading-7 sm:text-xl">{name}</h3>
              <p className="mt-1 text-xs font-bold text-emerald-100">رقم المترشح: {candidate.number || "—"}</p>
            </div>
            <span className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-white/15 text-xl ring-1 ring-white/20" aria-hidden="true">
              🎓
            </span>
          </div>

          <div className="mt-4 grid grid-cols-2 gap-2">
            <SummaryItem label="المعدل" value={formatNumber(candidate.average)} accent />
            <SummaryItem label="القرار" value={candidate.decision} />
            <SummaryItem label="الشعبة" value={candidate.series} />
            <SummaryItem label="تاريخ الميلاد" value={formatDate(candidate.birthDate)} />
          </div>

          <p className="mt-3 flex min-w-0 items-center gap-2 rounded-2xl bg-black/10 px-3 py-2.5 text-[11px] font-bold text-emerald-50 ring-1 ring-white/10">
            <span className="shrink-0" aria-hidden="true">📍</span>
            <span className="min-w-0 truncate">{centre}</span>
          </p>
        </div>

        <div className="flex items-center justify-between gap-3 border-b border-slate-200 bg-slate-50 px-3 py-3 dark:border-white/10 dark:bg-white/[.04] sm:px-4">
          <div>
            <p className="text-[9px] font-black text-mauri-green dark:text-emerald-300">الكشف التفصيلي</p>
            <h4 className="text-base font-black text-slate-900 dark:text-white">درجات المواد</h4>
          </div>
          <span className="rounded-full bg-mauri-green/10 px-3 py-1 text-[10px] font-black text-mauri-green dark:bg-emerald-300/10 dark:text-emerald-300">
            {subjects.length} مواد
          </span>
        </div>

        {subjects.length ? (
          <div className="divide-y divide-slate-100 dark:divide-white/10">
            {subjects.map((subject, index) => {
              const style = scoreStyle(subject.score);
              const unavailable = typeof subject.score !== "number" || subject.score < 0;
              const subjectName = subject.nameAr || subject.nameFr || `المادة ${index + 1}`;
              const frenchName = subject.nameFr && subject.nameFr !== subject.nameAr ? subject.nameFr : "";

              return (
                <article
                  key={`${subject.nameAr || subject.nameFr}-${index}`}
                  className="grid min-h-[68px] grid-cols-[minmax(0,1fr)_72px] items-center gap-3 px-3 py-2.5 transition hover:bg-slate-50/80 dark:hover:bg-white/[.03] sm:grid-cols-[minmax(0,1fr)_90px] sm:px-4"
                >
                  <div className="flex min-w-0 items-center gap-2.5">
                    <span className={`h-2.5 w-2.5 shrink-0 rounded-full ${style.dot}`} />
                    <div className="min-w-0 flex-1">
                      <h5 className="break-words text-[13px] font-black leading-5 text-slate-900 dark:text-white sm:text-sm">
                        {subjectName}
                      </h5>
                      <div className="mt-0.5 flex min-w-0 flex-wrap items-center gap-x-2 gap-y-0.5 text-[9px] font-black sm:text-[10px]">
                        {frenchName ? (
                          <span className="max-w-full truncate text-slate-500 dark:text-slate-400" dir="ltr">{frenchName}</span>
                        ) : null}
                        <span className="rounded-full bg-slate-100 px-2 py-0.5 text-slate-600 dark:bg-white/10 dark:text-slate-300">
                          المعامل {formatNumber(subject.coefficient, 0)}
                        </span>
                        <span className={style.labelClass}>{style.label}</span>
                      </div>
                    </div>
                  </div>

                  <div className="text-center">
                    <span className={`inline-flex min-w-[66px] flex-col items-center justify-center rounded-[14px] px-2 py-2 text-sm font-black ring-1 ${style.score}`}>
                      <span>{unavailable ? "—" : formatNumber(subject.score)}</span>
                      <small className="mt-0.5 text-[8px] font-black opacity-70">من 20</small>
                    </span>
                  </div>
                </article>
              );
            })}
          </div>
        ) : (
          <div className="p-6 text-center text-sm font-bold text-slate-500 dark:text-slate-300">
            بيانات المترشح موجودة، لكن تفاصيل المواد غير متاحة حاليًا من منصة الوزارة.
          </div>
        )}

        <p className="border-t border-slate-100 px-3 py-3 text-center text-[9px] font-bold leading-5 text-slate-500 dark:border-white/10 dark:text-slate-400">
          المصدر: منصة إدارة الامتحانات والمسابقات الرسمية
        </p>
      </section>
    </div>
  );
}

export default function BepcSubjectDetailsModal() {
  const [mounted, setMounted] = useState(false);
  const [open, setOpen] = useState(false);
  const [number, setNumber] = useState("");
  const [status, setStatus] = useState("idle");
  const [data, setData] = useState(null);
  const [error, setError] = useState("");
  const inputRef = useRef(null);
  const requestRef = useRef(null);

  const cleanNumber = useMemo(() => normalizeDigits(number), [number]);

  useEffect(() => {
    setMounted(true);

    const handleOpen = (event) => {
      const suggestedNumber = normalizeDigits(event?.detail?.number);
      setNumber(suggestedNumber);
      setStatus("idle");
      setData(null);
      setError("");
      setOpen(true);
    };

    window.addEventListener(OPEN_SUBJECT_DETAILS_EVENT, handleOpen);
    return () => {
      requestRef.current?.abort();
      window.removeEventListener(OPEN_SUBJECT_DETAILS_EVENT, handleOpen);
    };
  }, []);

  useEffect(() => {
    if (!open) return undefined;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const focusTimer = window.setTimeout(() => inputRef.current?.focus(), 100);
    const handleKeyDown = (event) => {
      if (event.key === "Escape") setOpen(false);
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.clearTimeout(focusTimer);
      window.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = previousOverflow;
    };
  }, [open]);

  async function searchSubjectDetails(event) {
    event?.preventDefault();
    if (!cleanNumber) {
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

    try {
      const response = await fetch(`/api/bepc-subject-details?number=${encodeURIComponent(cleanNumber)}`, {
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
  }

  function closeModal() {
    requestRef.current?.abort();
    setOpen(false);
  }

  if (!mounted || !open) return null;

  return createPortal(
    <div
      className="fixed inset-0 z-[9999] bg-slate-950/70 backdrop-blur-md sm:grid sm:place-items-center sm:p-4"
      role="presentation"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) closeModal();
      }}
    >
      <section
        className="flex h-[100dvh] w-full flex-col overflow-hidden bg-[#f6f8f6] shadow-[0_30px_90px_rgba(2,20,12,.4)] dark:bg-[#07130d] sm:h-[min(92dvh,850px)] sm:max-w-2xl sm:rounded-[30px] sm:border sm:border-white/70 dark:sm:border-white/10"
        role="dialog"
        aria-modal="true"
        aria-labelledby="subject-details-title"
        dir="rtl"
      >
        <header className="shrink-0 border-b border-slate-200/90 bg-white/95 px-3 pb-3 pt-[max(.75rem,env(safe-area-inset-top))] backdrop-blur-xl dark:border-white/10 dark:bg-[#0b1b12]/95 sm:px-5 sm:pt-3">
          <div className="flex items-center justify-between gap-3">
            <div className="flex min-w-0 items-center gap-3">
              <span className="grid h-10 w-10 shrink-0 place-items-center rounded-2xl bg-mauri-green/10 text-xl dark:bg-emerald-300/10" aria-hidden="true">
                📚
              </span>
              <div className="min-w-0">
                <p className="text-[9px] font-black text-mauri-green dark:text-emerald-300">البريفيه</p>
                <h2 id="subject-details-title" className="truncate text-base font-black text-slate-950 dark:text-white sm:text-lg">
                  تفاصيل المواد
                </h2>
              </div>
            </div>
            <button
              type="button"
              onClick={closeModal}
              className="grid h-10 w-10 shrink-0 place-items-center rounded-2xl border border-slate-200 bg-white text-xl font-black text-slate-600 transition active:scale-95 dark:border-white/10 dark:bg-white/[.06] dark:text-white"
              aria-label="إغلاق"
            >
              ×
            </button>
          </div>

          <form onSubmit={searchSubjectDetails} className="mt-3 grid grid-cols-[minmax(0,1fr)_88px] gap-2 sm:grid-cols-[minmax(0,1fr)_110px]">
            <label className="sr-only" htmlFor="bepc-subject-candidate-number">رقم المترشح</label>
            <div className="relative min-w-0">
              <span className="pointer-events-none absolute inset-y-0 right-3.5 grid place-items-center text-sm font-black text-slate-400" aria-hidden="true">#</span>
              <input
                ref={inputRef}
                id="bepc-subject-candidate-number"
                type="text"
                inputMode="numeric"
                autoComplete="off"
                value={number}
                onChange={(event) => setNumber(normalizeDigits(event.target.value))}
                placeholder="رقم المترشح"
                className="min-h-[48px] w-full rounded-[16px] border border-slate-200 bg-slate-50 px-9 text-base font-black text-slate-950 outline-none transition placeholder:text-sm placeholder:font-bold placeholder:text-slate-400 focus:border-mauri-green focus:bg-white focus:ring-4 focus:ring-mauri-green/10 dark:border-white/10 dark:bg-white/[.05] dark:text-white dark:focus:border-emerald-300"
              />
            </div>
            <button
              type="submit"
              disabled={status === "loading" || !cleanNumber}
              className="min-h-[48px] rounded-[16px] bg-gradient-to-l from-mauri-green via-emerald-600 to-emerald-500 px-3 text-sm font-black text-white shadow-[0_12px_28px_rgba(21,128,61,.22)] transition active:scale-[.98] disabled:pointer-events-none disabled:opacity-50"
            >
              {status === "loading" ? "انتظر..." : "بحث"}
            </button>
          </form>
        </header>

        <main className="min-h-0 flex-1 overflow-y-auto overscroll-contain" aria-live="polite">
          {status === "success" && data ? <ResultView data={data} /> : <SearchState status={status} error={error} />}
        </main>
      </section>
    </div>,
    document.body,
  );
}
