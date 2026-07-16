"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";

const OPEN_SUBJECT_DETAILS_EVENT = "mauriresults:open-subject-details";
const UNAVAILABLE_VALUES = new Set([
  "",
  "غير متوفر",
  "غير متوفرة",
  "غير محدد",
  "غير محددة",
  "non disponible",
  "indisponible",
  "unavailable",
  "undefined",
  "null",
  "-",
]);

function normalize(value) {
  return String(value || "").trim().replace(/\s+/g, " ").toLowerCase();
}

function normalizeDigits(value) {
  return String(value || "")
    .replace(/[٠-٩]/g, (digit) => String("٠١٢٣٤٥٦٧٨٩".indexOf(digit)))
    .replace(/\D/g, "")
    .slice(0, 14);
}

function sanitizeResultDetails() {
  document.querySelectorAll(".info-tile").forEach((tile) => {
    const value = normalize(tile.querySelector("strong")?.textContent);
    const shouldHide = UNAVAILABLE_VALUES.has(value);
    tile.toggleAttribute("hidden", shouldHide);
    tile.setAttribute("aria-hidden", shouldHide ? "true" : "false");
  });
}

function isBepcContext(card) {
  const activeLabel = document.querySelector('[aria-current="page"]')?.textContent || "";
  const context = normalize(`${window.location.hash} ${activeLabel} ${card.textContent || ""}`);
  return /bepc|brevet|البريفيه|ابريفه|أبريفه|بريفه|ختم الدروس الإعدادية/.test(context);
}

function extractCandidateNumber(card) {
  const explicit = card.querySelector("[data-candidate-number]");
  const explicitValue = normalizeDigits(explicit?.getAttribute("data-candidate-number") || explicit?.textContent);
  if (explicitValue) return explicitValue;

  for (const tile of card.querySelectorAll(".info-tile")) {
    const label = normalize(
      tile.querySelector("span, small, p, label")?.textContent || tile.getAttribute("aria-label") || "",
    );
    if (/رقم المترشح|رقم الملف|numéro|numero|n° dossier|dossier/.test(label)) {
      const value = normalizeDigits(tile.querySelector("strong")?.textContent || tile.textContent);
      if (value) return value;
    }
  }

  const text = String(card.textContent || "");
  const match = text.match(
    /(?:رقم المترشح|رقم الملف|رقم|numéro|numero|n°\s*dossier|dossier)\s*[:：-]?\s*([0-9٠-٩]{3,14})/i,
  );
  return normalizeDigits(match?.[1]);
}

function addSubjectDetailsButton() {
  document.querySelectorAll(".result-modal").forEach((card) => {
    const existing = card.querySelector("[data-subject-details-button]");

    if (!isBepcContext(card)) {
      existing?.remove();
      return;
    }

    if (existing?.tagName === "BUTTON") return;
    existing?.remove();

    const primaryActions = card.querySelector(".action-button")?.parentElement;
    if (!primaryActions) return;

    const button = document.createElement("button");
    button.type = "button";
    button.dataset.subjectDetailsButton = "true";
    button.className =
      "action-button mt-3 flex min-h-12 w-full items-center justify-center gap-2 rounded-[16px] border border-mauri-green/25 bg-mauri-green/5 px-4 text-sm font-black text-mauri-green transition hover:border-mauri-green/40 hover:bg-mauri-green/10 active:scale-[.98] dark:border-emerald-300/20 dark:bg-emerald-300/10 dark:text-emerald-300";
    button.setAttribute("aria-label", "البحث عن تفاصيل مواد البريفيه");
    button.innerHTML =
      '<span aria-hidden="true">📚</span><span>تفاصيل المواد</span><span aria-hidden="true">←</span>';
    button.addEventListener("click", () => {
      window.dispatchEvent(
        new CustomEvent(OPEN_SUBJECT_DETAILS_EVENT, {
          detail: { number: extractCandidateNumber(card) },
        }),
      );
    });

    primaryActions.insertAdjacentElement("afterend", button);
  });
}

function updateResultCard() {
  sanitizeResultDetails();
  addSubjectDetailsButton();
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

function scoreTheme(score) {
  if (typeof score !== "number" || score < 0) {
    return {
      rail: "bg-slate-300 dark:bg-slate-600",
      badge: "bg-slate-100 text-slate-600 ring-slate-200 dark:bg-white/10 dark:text-slate-300 dark:ring-white/10",
      label: "غير محتسب",
    };
  }
  if (score >= 10) {
    return {
      rail: "bg-emerald-500",
      badge: "bg-emerald-50 text-emerald-700 ring-emerald-200 dark:bg-emerald-300/10 dark:text-emerald-300 dark:ring-emerald-300/20",
      label: "جيد",
    };
  }
  if (score >= 8) {
    return {
      rail: "bg-amber-500",
      badge: "bg-amber-50 text-amber-700 ring-amber-200 dark:bg-amber-300/10 dark:text-amber-300 dark:ring-amber-300/20",
      label: "قريب من النجاح",
    };
  }
  return {
    rail: "bg-rose-500",
    badge: "bg-rose-50 text-rose-700 ring-rose-200 dark:bg-rose-300/10 dark:text-rose-300 dark:ring-rose-300/20",
    label: "أقل من 8",
  };
}

function CandidateHeader({ candidate, subjectCount }) {
  const name = candidate?.nameAr || candidate?.nameFr || "المترشح";
  const centre = candidate?.centreAr || candidate?.centreFr || "—";

  return (
    <div className="overflow-hidden rounded-[22px] bg-gradient-to-br from-emerald-950 via-emerald-800 to-emerald-600 text-white shadow-[0_18px_45px_rgba(6,78,59,.18)]">
      <div className="p-4 sm:p-5">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2 text-[10px] font-black text-emerald-100">
              <span className="rounded-full bg-white/12 px-2.5 py-1 ring-1 ring-white/15">بيانات رسمية</span>
              <span>{subjectCount} مواد</span>
            </div>
            <h3 className="mt-2 break-words text-lg font-black leading-7 sm:text-xl">{name}</h3>
            <p className="mt-1 text-xs font-bold text-emerald-100">رقم المترشح: {candidate?.number || "—"}</p>
          </div>
          <span className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-white/14 text-xl ring-1 ring-white/20" aria-hidden="true">
            🎓
          </span>
        </div>

        <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-4">
          <div className="rounded-2xl bg-white/10 px-3 py-2.5 ring-1 ring-white/10">
            <small className="block text-[9px] font-bold text-emerald-100">المعدل</small>
            <strong className="mt-1 block text-base font-black sm:text-lg">{formatNumber(candidate?.average)}</strong>
          </div>
          <div className="rounded-2xl bg-white/10 px-3 py-2.5 ring-1 ring-white/10">
            <small className="block text-[9px] font-bold text-emerald-100">القرار</small>
            <strong className="mt-1 block truncate text-xs font-black sm:text-sm">{candidate?.decision || "—"}</strong>
          </div>
          <div className="rounded-2xl bg-white/10 px-3 py-2.5 ring-1 ring-white/10">
            <small className="block text-[9px] font-bold text-emerald-100">الشعبة</small>
            <strong className="mt-1 block truncate text-xs font-black sm:text-sm">{candidate?.series || "—"}</strong>
          </div>
          <div className="rounded-2xl bg-white/10 px-3 py-2.5 ring-1 ring-white/10">
            <small className="block text-[9px] font-bold text-emerald-100">تاريخ الميلاد</small>
            <strong className="mt-1 block text-[11px] font-black sm:text-xs">{formatDate(candidate?.birthDate)}</strong>
          </div>
        </div>

        <div className="mt-3 flex min-w-0 items-center gap-2 rounded-2xl bg-black/10 px-3 py-2 ring-1 ring-white/10">
          <span aria-hidden="true">📍</span>
          <p className="min-w-0 truncate text-[11px] font-bold text-emerald-50">{centre}</p>
        </div>
      </div>
    </div>
  );
}

function SubjectRow({ subject, index }) {
  const theme = scoreTheme(subject.score);
  const unavailable = typeof subject.score !== "number" || subject.score < 0;
  const title = subject.nameAr || subject.nameFr || `المادة ${index + 1}`;
  const subtitle = subject.nameFr && subject.nameFr !== subject.nameAr ? subject.nameFr : "";

  return (
    <article className="relative overflow-hidden rounded-[18px] border border-slate-200/80 bg-white px-3 py-3 shadow-[0_8px_24px_rgba(15,23,42,.045)] dark:border-white/10 dark:bg-white/[.045] sm:px-4">
      <span className={`absolute inset-y-0 right-0 w-1 ${theme.rail}`} aria-hidden="true" />
      <div className="grid min-w-0 grid-cols-[minmax(0,1fr)_auto] items-center gap-3 pr-2">
        <div className="min-w-0">
          <h4 className="break-words text-[13px] font-black leading-5 text-slate-900 dark:text-white sm:text-sm">{title}</h4>
          <div className="mt-1 flex min-w-0 flex-wrap items-center gap-x-2 gap-y-1 text-[9px] font-bold text-slate-500 dark:text-slate-400 sm:text-[10px]">
            {subtitle ? <span className="max-w-full truncate" dir="ltr">{subtitle}</span> : null}
            <span>المعامل {formatNumber(subject.coefficient, 0)}</span>
            <span>{theme.label}</span>
          </div>
        </div>
        <div className={`min-w-[66px] rounded-[14px] px-2.5 py-2 text-center ring-1 ${theme.badge}`}>
          <strong className="block text-sm font-black sm:text-base">{unavailable ? "—" : formatNumber(subject.score)}</strong>
          <small className="mt-0.5 block text-[8px] font-black opacity-75">من 20</small>
        </div>
      </div>
    </article>
  );
}

function UnifiedResults({ data }) {
  const subjects = Array.isArray(data?.subjects) ? data.subjects : [];

  return (
    <div className="space-y-3">
      <CandidateHeader candidate={data?.candidate} subjectCount={subjects.length} />

      <div className="flex items-center justify-between gap-3 px-1">
        <div>
          <p className="text-[10px] font-black text-mauri-green dark:text-emerald-300">الكشف التفصيلي</p>
          <h3 className="text-base font-black text-slate-950 dark:text-white sm:text-lg">درجات المواد</h3>
        </div>
        <span className="rounded-full bg-mauri-green/10 px-3 py-1 text-[10px] font-black text-mauri-green dark:bg-emerald-300/10 dark:text-emerald-300">
          {subjects.length} مواد
        </span>
      </div>

      {subjects.length ? (
        <div className="grid min-w-0 grid-cols-1 gap-2 sm:grid-cols-2">
          {subjects.map((subject, index) => (
            <SubjectRow key={`${subject.nameAr || subject.nameFr}-${index}`} subject={subject} index={index} />
          ))}
        </div>
      ) : (
        <div className="rounded-[18px] border border-dashed border-slate-300 bg-white/70 p-5 text-center text-sm font-bold text-slate-500 dark:border-white/15 dark:bg-white/[.035] dark:text-slate-300">
          بيانات المترشح موجودة، لكن تفاصيل المواد غير متاحة حاليًا من منصة الوزارة.
        </div>
      )}

      <p className="px-2 pb-1 text-center text-[9px] font-bold leading-4 text-slate-500 dark:text-slate-400 sm:text-[10px]">
        البيانات معروضة مباشرة من منصة إدارة الامتحانات والمسابقات الرسمية.
      </p>
    </div>
  );
}

export default function ResultDetailSanitizer() {
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
    let timers = [];

    const schedule = () => {
      timers.forEach((timer) => window.clearTimeout(timer));
      timers = [0, 80, 240, 600].map((delay) => window.setTimeout(updateResultCard, delay));
    };

    const handleOpen = (event) => {
      const suggestedNumber = normalizeDigits(event?.detail?.number);
      setNumber(suggestedNumber);
      setStatus("idle");
      setData(null);
      setError("");
      setOpen(true);
    };

    schedule();
    window.addEventListener(OPEN_SUBJECT_DETAILS_EVENT, handleOpen);
    window.addEventListener("mauriresults:routechange", schedule);
    window.addEventListener("hashchange", schedule, { passive: true });
    window.addEventListener("popstate", schedule, { passive: true });

    return () => {
      timers.forEach((timer) => window.clearTimeout(timer));
      requestRef.current?.abort();
      window.removeEventListener(OPEN_SUBJECT_DETAILS_EVENT, handleOpen);
      window.removeEventListener("mauriresults:routechange", schedule);
      window.removeEventListener("hashchange", schedule);
      window.removeEventListener("popstate", schedule);
    };
  }, []);

  useEffect(() => {
    if (!open) return undefined;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const focusTimer = window.setTimeout(() => inputRef.current?.focus(), 80);
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
      className="fixed inset-0 z-[9999] grid place-items-center overflow-hidden bg-slate-950/65 p-0 backdrop-blur-md sm:p-4"
      role="presentation"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) closeModal();
      }}
    >
      <section
        className="flex h-[100dvh] w-full min-w-0 flex-col overflow-hidden bg-[#f6f8f6] shadow-[0_30px_90px_rgba(2,20,12,.35)] dark:bg-[#07130d] sm:h-auto sm:max-h-[92dvh] sm:max-w-3xl sm:rounded-[30px] sm:border sm:border-white/70 dark:sm:border-white/10"
        role="dialog"
        aria-modal="true"
        aria-labelledby="subject-details-title"
        dir="rtl"
      >
        <header className="z-20 flex shrink-0 items-center justify-between gap-3 border-b border-slate-200/80 bg-white/92 px-3 pb-3 pt-[max(.75rem,env(safe-area-inset-top))] backdrop-blur-xl dark:border-white/10 dark:bg-[#0b1b12]/92 sm:px-5 sm:py-3">
          <div className="flex min-w-0 items-center gap-3">
            <span className="grid h-10 w-10 shrink-0 place-items-center rounded-2xl bg-mauri-green/10 text-lg text-mauri-green dark:bg-emerald-300/10" aria-hidden="true">
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
            className="grid h-10 w-10 shrink-0 place-items-center rounded-2xl border border-slate-200 bg-white text-lg font-black text-slate-600 transition hover:border-rose-200 hover:bg-rose-50 hover:text-rose-600 active:scale-95 dark:border-white/10 dark:bg-white/[.06] dark:text-white"
            aria-label="إغلاق"
          >
            ×
          </button>
        </header>

        <div className="shrink-0 border-b border-slate-200/70 bg-white/80 px-3 py-3 backdrop-blur-lg dark:border-white/10 dark:bg-[#0b1b12]/75 sm:px-5">
          <form onSubmit={searchSubjectDetails} className="grid grid-cols-[minmax(0,1fr)_auto] gap-2">
            <label className="sr-only" htmlFor="bepc-subject-candidate-number">رقم المترشح</label>
            <div className="relative min-w-0">
              <span className="pointer-events-none absolute inset-y-0 right-3 grid place-items-center text-sm font-black text-slate-400" aria-hidden="true">#</span>
              <input
                ref={inputRef}
                id="bepc-subject-candidate-number"
                type="text"
                inputMode="numeric"
                autoComplete="off"
                value={number}
                onChange={(event) => setNumber(normalizeDigits(event.target.value))}
                placeholder="رقم المترشح"
                className="h-12 w-full min-w-0 rounded-[16px] border border-slate-200 bg-slate-50 pr-9 pl-3 text-sm font-black text-slate-950 outline-none transition placeholder:text-slate-400 focus:border-mauri-green focus:bg-white focus:ring-4 focus:ring-mauri-green/10 dark:border-white/10 dark:bg-white/[.05] dark:text-white dark:focus:border-emerald-300"
              />
            </div>
            <button
              type="submit"
              disabled={status === "loading" || !cleanNumber}
              className="h-12 min-w-[86px] rounded-[16px] bg-gradient-to-l from-mauri-green via-emerald-600 to-emerald-500 px-4 text-xs font-black text-white shadow-[0_12px_26px_rgba(21,128,61,.20)] transition hover:-translate-y-0.5 active:scale-[.98] disabled:pointer-events-none disabled:opacity-50 sm:min-w-28 sm:text-sm"
            >
              {status === "loading" ? "بحث..." : "بحث"}
            </button>
          </form>
        </div>

        <main className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-3 py-3 pb-[max(1rem,env(safe-area-inset-bottom))] sm:px-5 sm:py-4">
          <div aria-live="polite">
            {status === "idle" ? (
              <div className="grid min-h-[46dvh] place-items-center rounded-[22px] border border-dashed border-slate-300 bg-white/60 p-6 text-center dark:border-white/15 dark:bg-white/[.03] sm:min-h-64">
                <div>
                  <span className="text-4xl" aria-hidden="true">🔎</span>
                  <h3 className="mt-3 text-base font-black text-slate-800 dark:text-white">ابحث عن درجات المواد</h3>
                  <p className="mx-auto mt-1 max-w-sm text-xs font-bold leading-6 text-slate-500 dark:text-slate-400">
                    أدخل رقم المترشح، وستظهر بياناته ودرجات جميع المواد في هذه الواجهة نفسها.
                  </p>
                </div>
              </div>
            ) : null}

            {status === "loading" ? (
              <div className="space-y-3">
                <div className="h-44 animate-pulse rounded-[22px] bg-slate-200/80 dark:bg-white/10" />
                <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                  {Array.from({ length: 6 }).map((_, index) => (
                    <div key={index} className="h-20 animate-pulse rounded-[18px] bg-slate-200/70 dark:bg-white/10" />
                  ))}
                </div>
              </div>
            ) : null}

            {status === "error" ? (
              <div className="grid min-h-[40dvh] place-items-center rounded-[22px] border border-rose-200 bg-rose-50 p-6 text-center dark:border-rose-300/15 dark:bg-rose-300/[.07] sm:min-h-56">
                <div>
                  <span className="text-3xl" aria-hidden="true">⚠️</span>
                  <p className="mt-3 text-sm font-black text-rose-700 dark:text-rose-200">{error}</p>
                  <p className="mt-1 text-[11px] font-bold text-rose-600/80 dark:text-rose-200/70">تأكد من الرقم ثم أعد المحاولة.</p>
                </div>
              </div>
            ) : null}

            {status === "success" && data ? <UnifiedResults data={data} /> : null}
          </div>
        </main>
      </section>
    </div>,
    document.body,
  );
}
