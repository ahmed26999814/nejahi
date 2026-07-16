"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import BepcSubjectsThemeToggle from "./BepcSubjectsThemeToggle";

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

function gradeTheme(score) {
  if (typeof score !== "number" || score < 0) {
    return {
      card: "border-slate-200 bg-slate-50 dark:border-white/10 dark:bg-white/[.04]",
      score: "bg-slate-200 text-slate-700 dark:bg-white/10 dark:text-slate-200",
      accent: "bg-slate-400",
    };
  }

  if (score >= 10) {
    return {
      card: "border-emerald-200 bg-emerald-50/65 dark:border-emerald-300/15 dark:bg-emerald-300/[.07]",
      score: "bg-emerald-600 text-white",
      accent: "bg-emerald-500",
    };
  }

  if (score >= 8) {
    return {
      card: "border-amber-200 bg-amber-50/70 dark:border-amber-300/15 dark:bg-amber-300/[.07]",
      score: "bg-amber-500 text-white",
      accent: "bg-amber-500",
    };
  }

  return {
    card: "border-rose-200 bg-rose-50/65 dark:border-rose-300/15 dark:bg-rose-300/[.07]",
    score: "bg-rose-500 text-white",
    accent: "bg-rose-500",
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

function QuranVerseBanner() {
  return (
    <aside className="relative z-40 border-b border-amber-300/15 bg-gradient-to-l from-[#06150d] via-[#0a2417] to-[#06150d] px-3 py-2.5 text-center text-amber-50 shadow-[0_8px_22px_rgba(0,0,0,.16)]">
      <p className="mx-auto max-w-2xl text-[10px] font-bold leading-5 sm:text-xs sm:leading-6">
        ﴿ إِنَّ اللَّهَ وَمَلَائِكَتَهُ يُصَلُّونَ عَلَى النَّبِيِّ ۚ يَا أَيُّهَا الَّذِينَ آمَنُوا صَلُّوا عَلَيْهِ وَسَلِّمُوا تَسْلِيمًا ﴾
      </p>
      <span className="mt-0.5 block text-[8px] font-black text-emerald-300/80">سورة الأحزاب — الآية ٥٦</span>
    </aside>
  );
}

function SubjectTile({ subject, index }) {
  const theme = gradeTheme(subject.score);
  const unavailable = typeof subject.score !== "number" || subject.score < 0;
  const name = subject.nameAr || subject.nameFr || `المادة ${index + 1}`;

  return (
    <article className={`relative min-h-[78px] overflow-hidden rounded-[17px] border p-2.5 ${theme.card}`}>
      <span className={`absolute inset-y-0 right-0 w-1 ${theme.accent}`} aria-hidden="true" />
      <div className="flex h-full min-w-0 items-center gap-2 pr-1">
        <div className="min-w-0 flex-1">
          <h3 className="text-[11px] font-black leading-[1.15rem] text-slate-950 dark:text-white sm:text-xs">{name}</h3>
          <span className="mt-1.5 inline-flex rounded-full bg-white/75 px-2 py-0.5 text-[8px] font-black text-slate-500 ring-1 ring-black/5 dark:bg-white/10 dark:text-slate-300 dark:ring-white/10">
            المعامل {formatNumber(subject.coefficient, 0)}
          </span>
        </div>
        <div className={`grid h-13 min-h-[52px] w-13 min-w-[52px] shrink-0 place-items-center rounded-[15px] text-center shadow-sm ${theme.score}`}>
          <div>
            <strong className="block text-xl font-black leading-none">{unavailable ? "—" : formatNumber(subject.score)}</strong>
            <small className="mt-1 block text-[8px] font-black opacity-85">{unavailable ? "معفى" : "/ 20"}</small>
          </div>
        </div>
      </div>
    </article>
  );
}

function LoadingState() {
  return (
    <div className="rounded-[24px] border border-slate-200 bg-white p-3 shadow-sm dark:border-white/10 dark:bg-[#0c1c13]">
      <div className="mb-3 h-24 animate-pulse rounded-[18px] bg-slate-200/75 dark:bg-white/10" />
      <div className="grid grid-cols-2 gap-2">
        {Array.from({ length: 10 }).map((_, index) => (
          <div key={index} className="h-[78px] animate-pulse rounded-[17px] bg-slate-200/70 dark:bg-white/10" />
        ))}
      </div>
    </div>
  );
}

function ResultsView({ data }) {
  const candidate = data?.candidate || {};
  const subjects = Array.isArray(data?.subjects) ? data.subjects : [];
  const name = candidate.nameAr || candidate.nameFr || "المترشح";
  const centre = candidate.centreAr || candidate.centreFr || "";

  return (
    <section className="overflow-hidden rounded-[24px] border border-slate-200/90 bg-white shadow-[0_18px_55px_rgba(15,23,42,.09)] dark:border-white/10 dark:bg-[#0c1c13]">
      <div className="relative overflow-hidden bg-gradient-to-l from-[#075f3c] to-[#0f8e59] px-3 py-3 text-white sm:px-4">
        <div className="absolute -left-8 -top-10 h-28 w-28 rounded-full bg-white/10 blur-2xl" aria-hidden="true" />
        <div className="relative flex min-w-0 items-center gap-3">
          <span className="grid h-10 w-10 shrink-0 place-items-center rounded-[14px] bg-white/15 text-xl ring-1 ring-white/15" aria-hidden="true">🎓</span>
          <div className="min-w-0 flex-1">
            <h1 className="truncate text-sm font-black sm:text-base">{name}</h1>
            <p className="mt-0.5 truncate text-[9px] font-bold text-emerald-100 sm:text-[10px]">
              رقم المترشح: <b className="text-white" dir="ltr">{candidate.number || "—"}</b>{centre ? ` · ${centre}` : ""}
            </p>
          </div>
          <div className="grid grid-cols-2 gap-1.5 text-center">
            <div className="min-w-[54px] rounded-[13px] bg-white/12 px-2 py-1.5 ring-1 ring-white/15">
              <small className="block text-[7px] font-black text-emerald-100">المعدل</small>
              <strong className="mt-0.5 block text-base font-black leading-none">{formatNumber(candidate.average)}</strong>
            </div>
            <div className="min-w-[58px] rounded-[13px] bg-white/12 px-2 py-1.5 ring-1 ring-white/15">
              <small className="block text-[7px] font-black text-emerald-100">القرار</small>
              <strong className="mt-0.5 block max-w-[70px] truncate text-[10px] font-black leading-4">{candidate.decision || "—"}</strong>
            </div>
          </div>
        </div>
      </div>

      <div className="flex items-center justify-between gap-2 border-b border-slate-100 px-3 py-2 dark:border-white/10">
        <h2 className="text-sm font-black text-slate-950 dark:text-white">درجات المواد</h2>
        <span className="rounded-full bg-emerald-50 px-2.5 py-1 text-[9px] font-black text-emerald-700 dark:bg-emerald-300/10 dark:text-emerald-300">{subjects.length} مواد</span>
      </div>

      {subjects.length ? (
        <div className="grid grid-cols-2 gap-2 p-2.5 sm:p-3">
          {subjects.map((subject, index) => (
            <SubjectTile key={`${subject.nameAr || subject.nameFr}-${index}`} subject={subject} index={index} />
          ))}
        </div>
      ) : (
        <div className="p-7 text-center text-sm font-black text-slate-600 dark:text-slate-300">درجات المواد غير متاحة حاليًا.</div>
      )}

      <footer className="border-t border-slate-100 px-3 py-2 text-center text-[8px] font-bold text-slate-400 dark:border-white/10 dark:text-slate-500">
        المصدر: منصة إدارة الامتحانات والمسابقات الرسمية
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

  function resetSearch() {
    requestRef.current?.abort();
    setStatus("idle");
    setData(null);
    setError("");
    const url = new URL(window.location.href);
    url.searchParams.delete("number");
    window.history.replaceState({}, "", url);
  }

  function goBack() {
    if (window.history.length > 1) window.history.back();
    else window.location.assign("/");
  }

  const showingResult = status === "success" && data;

  return (
    <main dir="rtl" className="min-h-[100dvh] bg-[#f3f7f4] text-slate-950 dark:bg-[#061109] dark:text-white">
      <div className="pointer-events-none fixed inset-x-0 top-0 h-56 bg-gradient-to-b from-emerald-100/65 to-transparent dark:from-emerald-950/35" aria-hidden="true" />

      <QuranVerseBanner />

      <header className="sticky top-0 z-30 border-b border-slate-200/80 bg-white/95 text-slate-950 shadow-[0_8px_26px_rgba(15,23,42,.08)] backdrop-blur-xl dark:border-white/10 dark:bg-[#07130d] dark:text-white dark:shadow-[0_8px_26px_rgba(0,0,0,.22)]">
        <div className="mx-auto flex min-h-[60px] max-w-2xl items-center justify-between gap-3 px-3 pt-[env(safe-area-inset-top)] sm:px-4">
          <button type="button" onClick={goBack} className="grid h-10 w-10 shrink-0 place-items-center rounded-[15px] border border-slate-200 bg-white text-slate-700 shadow-sm transition active:scale-95 dark:border-white/10 dark:bg-white/[.06] dark:text-white" aria-label="رجوع">
            <ArrowRightIcon />
          </button>
          <div className="min-w-0 flex-1 text-center">
            <p className="text-[8px] font-black text-emerald-700 dark:text-emerald-300">البريفيه</p>
            <h1 className="truncate text-base font-black">تفاصيل درجات المواد</h1>
          </div>
          <div className="flex shrink-0 items-center gap-1.5">
            <BepcSubjectsThemeToggle />
            {showingResult ? (
              <button type="button" onClick={resetSearch} className="grid h-10 w-10 shrink-0 place-items-center rounded-[15px] bg-emerald-100 text-emerald-700 transition active:scale-95 dark:bg-emerald-300/10 dark:text-emerald-300" aria-label="بحث جديد">
                <SearchIcon />
              </button>
            ) : (
              <div className="grid h-10 w-10 shrink-0 place-items-center rounded-[15px] bg-emerald-100 text-xl dark:bg-emerald-300/10" aria-hidden="true">📚</div>
            )}
          </div>
        </div>
      </header>

      <div className={`relative mx-auto w-full max-w-2xl px-2.5 pb-6 sm:px-4 ${showingResult ? "py-2.5" : "py-4"}`}>
        {!showingResult ? (
          <section className="mb-3 rounded-[22px] border border-white/80 bg-white/92 p-3 shadow-[0_14px_38px_rgba(15,23,42,.07)] dark:border-white/10 dark:bg-[#0c1c13]/92">
            <h2 className="px-1 text-base font-black text-slate-950 dark:text-white">ابحث برقم المترشح</h2>
            <p className="mb-2.5 mt-0.5 px-1 text-[10px] font-bold text-slate-500 dark:text-slate-400">ستظهر جميع المواد في شاشة واحدة.</p>
            <form onSubmit={handleSubmit} className="grid grid-cols-[minmax(0,1fr)_88px] gap-2">
              <label htmlFor="bepc-subject-number" className="sr-only">رقم المترشح</label>
              <div className="relative min-w-0">
                <span className="pointer-events-none absolute inset-y-0 right-3.5 grid place-items-center text-slate-400"><SearchIcon /></span>
                <input
                  id="bepc-subject-number"
                  type="text"
                  inputMode="numeric"
                  autoComplete="off"
                  value={number}
                  onChange={(event) => setNumber(normalizeDigits(event.target.value))}
                  placeholder="مثال: 75457"
                  className="min-h-[48px] w-full min-w-0 rounded-[16px] border border-slate-200 bg-slate-50 pr-11 pl-3 text-base font-black text-slate-950 outline-none transition placeholder:text-sm placeholder:font-bold placeholder:text-slate-400 focus:border-emerald-500 focus:bg-white focus:ring-4 focus:ring-emerald-500/10 dark:border-white/10 dark:bg-white/[.05] dark:text-white"
                />
              </div>
              <button type="submit" disabled={status === "loading" || !cleanNumber} className="min-h-[48px] rounded-[16px] bg-gradient-to-l from-[#087047] to-[#19a468] px-3 text-sm font-black text-white shadow-[0_12px_26px_rgba(5,150,105,.20)] transition active:scale-[.98] disabled:pointer-events-none disabled:opacity-50">
                {status === "loading" ? "انتظر" : "بحث"}
              </button>
            </form>
          </section>
        ) : null}

        <div aria-live="polite">
          {status === "idle" ? (
            <section className="grid min-h-[46dvh] place-items-center rounded-[24px] border border-dashed border-emerald-200 bg-white/70 p-6 text-center dark:border-emerald-300/15 dark:bg-white/[.03]">
              <div className="max-w-xs">
                <span className="mx-auto grid h-14 w-14 place-items-center rounded-[20px] bg-emerald-100 text-2xl dark:bg-emerald-300/10" aria-hidden="true">🔎</span>
                <h2 className="mt-3 text-base font-black">كشف المواد الكامل</h2>
                <p className="mt-1.5 text-xs font-bold leading-5 text-slate-500 dark:text-slate-400">أدخل رقم المترشح لعرض جميع الدرجات بوضوح.</p>
              </div>
            </section>
          ) : null}

          {status === "loading" ? <LoadingState /> : null}

          {status === "error" ? (
            <section className="grid min-h-[40dvh] place-items-center rounded-[24px] border border-rose-200 bg-white p-6 text-center shadow-sm dark:border-rose-300/15 dark:bg-[#0c1c13]">
              <div className="max-w-xs">
                <span className="mx-auto grid h-12 w-12 place-items-center rounded-2xl bg-rose-100 text-xl dark:bg-rose-300/10" aria-hidden="true">⚠️</span>
                <h2 className="mt-3 text-sm font-black">تعذر عرض الكشف</h2>
                <p className="mt-1.5 text-xs font-bold leading-5 text-rose-700 dark:text-rose-200">{error}</p>
              </div>
            </section>
          ) : null}

          {showingResult ? <ResultsView data={data} /> : null}
        </div>
      </div>
    </main>
  );
}
