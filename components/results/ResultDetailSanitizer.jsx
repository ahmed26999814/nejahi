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
  return new Intl.DateTimeFormat("ar-MR", { year: "numeric", month: "2-digit", day: "2-digit" }).format(date);
}

function subjectTone(score) {
  if (typeof score !== "number" || score < 0) {
    return {
      card: "border-slate-200 bg-slate-50/80 dark:border-white/10 dark:bg-white/[.04]",
      badge: "bg-slate-200 text-slate-600 dark:bg-white/10 dark:text-slate-300",
    };
  }
  if (score >= 10) {
    return {
      card: "border-emerald-200/80 bg-emerald-50/75 dark:border-emerald-300/15 dark:bg-emerald-300/[.07]",
      badge: "bg-emerald-600 text-white",
    };
  }
  if (score >= 8) {
    return {
      card: "border-amber-200/80 bg-amber-50/80 dark:border-amber-300/15 dark:bg-amber-300/[.07]",
      badge: "bg-amber-500 text-white",
    };
  }
  return {
    card: "border-rose-200/80 bg-rose-50/75 dark:border-rose-300/15 dark:bg-rose-300/[.07]",
    badge: "bg-rose-500 text-white",
  };
}

function CandidateSummary({ candidate }) {
  if (!candidate) return null;
  const name = candidate.nameAr || candidate.nameFr || "المترشح";
  const centre = candidate.centreAr || candidate.centreFr || "—";

  return (
    <section className="overflow-hidden rounded-[24px] border border-emerald-200/80 bg-gradient-to-br from-emerald-950 via-emerald-800 to-emerald-600 p-4 text-white shadow-[0_20px_50px_rgba(6,78,59,.20)] sm:p-5">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-[11px] font-black text-emerald-100">بيانات المترشح الرسمية</p>
          <h3 className="mt-1 text-lg font-black leading-7 sm:text-xl">{name}</h3>
          <p className="mt-1 text-xs font-bold text-emerald-100">رقم المترشح: {candidate.number || "—"}</p>
        </div>
        <span className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-white/15 text-xl ring-1 ring-white/20" aria-hidden="true">
          🎓
        </span>
      </div>

      <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-4">
        <div className="rounded-2xl bg-white/10 p-3 ring-1 ring-white/10">
          <small className="block text-[10px] font-bold text-emerald-100">المعدل</small>
          <strong className="mt-1 block text-lg font-black">{formatNumber(candidate.average)}</strong>
        </div>
        <div className="rounded-2xl bg-white/10 p-3 ring-1 ring-white/10">
          <small className="block text-[10px] font-bold text-emerald-100">القرار</small>
          <strong className="mt-1 block truncate text-sm font-black">{candidate.decision || "—"}</strong>
        </div>
        <div className="rounded-2xl bg-white/10 p-3 ring-1 ring-white/10">
          <small className="block text-[10px] font-bold text-emerald-100">الشعبة</small>
          <strong className="mt-1 block text-sm font-black">{candidate.series || "—"}</strong>
        </div>
        <div className="rounded-2xl bg-white/10 p-3 ring-1 ring-white/10">
          <small className="block text-[10px] font-bold text-emerald-100">تاريخ الميلاد</small>
          <strong className="mt-1 block text-xs font-black">{formatDate(candidate.birthDate)}</strong>
        </div>
      </div>

      <p className="mt-3 rounded-2xl bg-black/10 px-3 py-2 text-xs font-bold leading-5 text-emerald-50 ring-1 ring-white/10">
        المركز: {centre}
      </p>
    </section>
  );
}

function SubjectsResult({ data }) {
  const subjects = Array.isArray(data?.subjects) ? data.subjects : [];

  return (
    <div className="grid gap-3">
      <CandidateSummary candidate={data?.candidate} />

      <section className="rounded-[24px] border border-slate-200/80 bg-white/95 p-3 shadow-[0_16px_45px_rgba(15,23,42,.07)] dark:border-white/10 dark:bg-[#0d1f16]/95 sm:p-4">
        <header className="mb-3 flex items-center justify-between gap-3">
          <div>
            <p className="text-[11px] font-black text-mauri-green dark:text-emerald-300">الكشف التفصيلي</p>
            <h3 className="mt-0.5 text-lg font-black text-slate-950 dark:text-white">درجات المواد</h3>
          </div>
          <span className="rounded-full bg-mauri-green/10 px-3 py-1 text-[11px] font-black text-mauri-green dark:bg-emerald-300/10 dark:text-emerald-300">
            {subjects.length} مواد
          </span>
        </header>

        {subjects.length ? (
          <div className="grid gap-2 sm:grid-cols-2">
            {subjects.map((subject, index) => {
              const tone = subjectTone(subject.score);
              const unavailable = typeof subject.score !== "number" || subject.score < 0;
              return (
                <article key={`${subject.nameAr || subject.nameFr}-${index}`} className={`rounded-[19px] border p-3 ${tone.card}`}>
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <h4 className="text-sm font-black leading-6 text-slate-900 dark:text-white">
                        {subject.nameAr || subject.nameFr || `المادة ${index + 1}`}
                      </h4>
                      {subject.nameFr && subject.nameFr !== subject.nameAr ? (
                        <p className="mt-0.5 truncate text-[10px] font-bold text-slate-500 dark:text-slate-400" dir="ltr">
                          {subject.nameFr}
                        </p>
                      ) : null}
                    </div>
                    <span className={`shrink-0 rounded-xl px-2.5 py-1.5 text-xs font-black ${tone.badge}`}>
                      {unavailable ? "—" : `${formatNumber(subject.score)} / 20`}
                    </span>
                  </div>
                  <div className="mt-2 flex items-center justify-between gap-2 border-t border-black/5 pt-2 text-[10px] font-bold text-slate-500 dark:border-white/10 dark:text-slate-400">
                    <span>المعامل: {formatNumber(subject.coefficient, 0)}</span>
                    <span>{unavailable ? "غير محتسب" : subject.score >= 10 ? "ناجح في المادة" : "أقل من 10"}</span>
                  </div>
                </article>
              );
            })}
          </div>
        ) : (
          <div className="rounded-2xl border border-dashed border-slate-300 p-5 text-center text-sm font-bold text-slate-500 dark:border-white/15 dark:text-slate-300">
            بيانات المترشح موجودة، لكن تفاصيل المواد غير متاحة حاليًا من منصة الوزارة.
          </div>
        )}
      </section>

      <p className="text-center text-[10px] font-bold leading-5 text-slate-500 dark:text-slate-400">
        البيانات معروضة من منصة إدارة الامتحانات والمسابقات الرسمية.
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
      className="fixed inset-0 z-[9999] grid place-items-center overflow-y-auto bg-slate-950/65 p-2 backdrop-blur-md sm:p-4"
      role="presentation"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) closeModal();
      }}
    >
      <section
        className="relative my-auto w-full max-w-3xl overflow-hidden rounded-[28px] border border-white/70 bg-[#f6f8f6] shadow-[0_30px_90px_rgba(2,20,12,.35)] dark:border-white/10 dark:bg-[#07130d]"
        role="dialog"
        aria-modal="true"
        aria-labelledby="subject-details-title"
        dir="rtl"
      >
        <header className="sticky top-0 z-10 flex items-center justify-between gap-3 border-b border-slate-200/80 bg-white/90 px-4 py-3 backdrop-blur-xl dark:border-white/10 dark:bg-[#0b1b12]/90 sm:px-5">
          <div className="flex min-w-0 items-center gap-3">
            <span className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-mauri-green/10 text-xl text-mauri-green dark:bg-emerald-300/10" aria-hidden="true">
              📚
            </span>
            <div className="min-w-0">
              <p className="text-[10px] font-black text-mauri-green dark:text-emerald-300">البريفيه</p>
              <h2 id="subject-details-title" className="truncate text-lg font-black text-slate-950 dark:text-white">
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

        <div className="max-h-[calc(100dvh-5rem)] overflow-y-auto p-3 sm:p-5">
          <section className="rounded-[24px] border border-slate-200/80 bg-white/95 p-4 shadow-[0_16px_45px_rgba(15,23,42,.06)] dark:border-white/10 dark:bg-[#0d1f16]/95 sm:p-5">
            <div className="mb-4">
              <p className="text-[11px] font-black text-mauri-green dark:text-emerald-300">البحث الرسمي</p>
              <h3 className="mt-1 text-xl font-black text-slate-950 dark:text-white">أدخل رقم المترشح</h3>
              <p className="mt-1 text-xs font-bold leading-5 text-slate-500 dark:text-slate-400">
                سيبحث MauriResults نيابةً عنك في منصة إدارة الامتحانات، ثم يعرض الدرجات هنا.
              </p>
            </div>

            <form onSubmit={searchSubjectDetails} className="grid gap-2 sm:grid-cols-[1fr_auto]">
              <label className="sr-only" htmlFor="bepc-subject-candidate-number">
                رقم المترشح
              </label>
              <div className="relative">
                <span className="pointer-events-none absolute inset-y-0 right-4 grid place-items-center text-slate-400" aria-hidden="true">
                  #
                </span>
                <input
                  ref={inputRef}
                  id="bepc-subject-candidate-number"
                  type="text"
                  inputMode="numeric"
                  autoComplete="off"
                  value={number}
                  onChange={(event) => setNumber(normalizeDigits(event.target.value))}
                  placeholder="مثال: 75457"
                  className="h-13 min-h-[52px] w-full rounded-[17px] border border-slate-200 bg-slate-50 px-11 text-base font-black text-slate-950 outline-none transition placeholder:text-slate-400 focus:border-mauri-green focus:bg-white focus:ring-4 focus:ring-mauri-green/10 dark:border-white/10 dark:bg-white/[.05] dark:text-white dark:focus:border-emerald-300"
                />
              </div>
              <button
                type="submit"
                disabled={status === "loading" || !cleanNumber}
                className="min-h-[52px] rounded-[17px] bg-gradient-to-l from-mauri-green via-emerald-600 to-emerald-500 px-6 text-sm font-black text-white shadow-[0_14px_30px_rgba(21,128,61,.20)] transition hover:-translate-y-0.5 hover:shadow-[0_18px_38px_rgba(21,128,61,.28)] active:scale-[.98] disabled:pointer-events-none disabled:opacity-50 sm:min-w-32"
              >
                {status === "loading" ? "جاري البحث..." : "بحث"}
              </button>
            </form>
          </section>

          <div className="mt-3" aria-live="polite">
            {status === "idle" ? (
              <div className="rounded-[22px] border border-dashed border-slate-300 bg-white/55 p-5 text-center dark:border-white/15 dark:bg-white/[.03]">
                <span className="text-3xl" aria-hidden="true">🔎</span>
                <p className="mt-2 text-sm font-black text-slate-700 dark:text-slate-200">أدخل الرقم لعرض درجات جميع المواد.</p>
              </div>
            ) : null}

            {status === "loading" ? (
              <div className="grid gap-3 rounded-[22px] border border-slate-200/80 bg-white/80 p-4 dark:border-white/10 dark:bg-white/[.04]">
                <div className="h-20 animate-pulse rounded-2xl bg-slate-200/80 dark:bg-white/10" />
                <div className="grid grid-cols-2 gap-2">
                  <div className="h-24 animate-pulse rounded-2xl bg-slate-200/70 dark:bg-white/10" />
                  <div className="h-24 animate-pulse rounded-2xl bg-slate-200/70 dark:bg-white/10" />
                </div>
              </div>
            ) : null}

            {status === "error" ? (
              <div className="rounded-[22px] border border-rose-200 bg-rose-50 p-4 text-center dark:border-rose-300/15 dark:bg-rose-300/[.07]">
                <span className="text-2xl" aria-hidden="true">⚠️</span>
                <p className="mt-2 text-sm font-black text-rose-700 dark:text-rose-200">{error}</p>
                <p className="mt-1 text-[11px] font-bold text-rose-600/80 dark:text-rose-200/70">
                  تأكد من الرقم ثم أعد المحاولة.
                </p>
              </div>
            ) : null}

            {status === "success" && data ? <SubjectsResult data={data} /> : null}
          </div>
        </div>
      </section>
    </div>,
    document.body,
  );
}
