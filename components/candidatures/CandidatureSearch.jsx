"use client";

import { useEffect, useMemo, useState } from "react";
import {
  AlertTriangle,
  BadgeCheck,
  Check,
  CheckCircle2,
  ChevronLeft,
  LoaderCircle,
  Search,
  Sparkles,
  UserRound,
  X,
  XCircle,
} from "lucide-react";

const POSITIVE_STATUSES = new Set(["temporary_accepted", "final_accepted", "eligible", "successful"]);
const CONFETTI = [
  [8, 8, "#f4b916", 0], [18, 18, "#22c55e", .18], [30, 7, "#38bdf8", .08], [42, 15, "#f59e0b", .28],
  [55, 6, "#34d399", .12], [68, 18, "#facc15", .34], [80, 8, "#60a5fa", .22], [91, 16, "#22c55e", .06],
  [13, 36, "#fb7185", .3], [27, 46, "#f4b916", .05], [72, 42, "#34d399", .26], [87, 34, "#facc15", .14],
];

const STATUS_META = {
  temporary_accepted: { label: "مقبول", icon: CheckCircle2, positive: true },
  temporary_rejected: { label: "غير مقبول", icon: XCircle, positive: false },
  final_accepted: { label: "مقبول نهائيًا", icon: BadgeCheck, positive: true },
  eligible: { label: "مؤهل", icon: CheckCircle2, positive: true },
  successful: { label: "ناجح", icon: BadgeCheck, positive: true },
  waiting_list: { label: "لائحة تكميلية", icon: AlertTriangle, positive: false },
};

function getStatusMeta(status) {
  return STATUS_META[status] || { label: "قيد المتابعة", icon: AlertTriangle, positive: false };
}

function getResultCopy(status) {
  if (status === "successful") return { eyebrow: "نجاح مستحق", title: "ألف مبروك! 🎉", body: "تم تسجيلك ضمن الناجحين. نتمنى لك مزيدًا من النجاح والتوفيق." };
  if (status === "final_accepted") return { eyebrow: "تم القبول", title: "تهانينا لك 🎉", body: "تم قبول ملفك نهائيًا. تابع إعلانات المسابقة لمعرفة الخطوة التالية." };
  if (status === "eligible") return { eyebrow: "المرحلة التالية", title: "مبروك! أنت مؤهل ✨", body: "أنت مؤهل للمرحلة التالية. تابع إعلانات المسابقة لمعرفة المواعيد والتفاصيل." };
  if (status === "temporary_accepted") return { eyebrow: "تم قبول ملفك", title: "مبروك! تم قبولك 🎉", body: "اسمك موجود ضمن لائحة المقبولين الحالية. تابع إعلانات المسابقة لأي تحديث لاحق." };
  if (status === "waiting_list") return { eyebrow: "وضعية الترشح", title: "أنت ضمن اللائحة التكميلية", body: "تابع تحديثات المسابقة لأن وضعية اللائحة قد تتغير لاحقًا." };
  if (status === "temporary_rejected") return { eyebrow: "وضعية الترشح", title: "لم يتم قبول ملفك", body: "راجع سبب عدم القبول أدناه، وتابع إجراءات التظلم إن كانت متاحة." };
  return { eyebrow: "حالة الملف", title: "تم العثور على ترشحك", body: "هذه أحدث حالة مسجلة لهذا الترشح." };
}

function inferMode(value) {
  return /^\d+$/.test(value.replace(/\s+/g, "")) ? "receipt" : "name";
}

function CandidateResultModal({ candidate, competition, onClose }) {
  const meta = getStatusMeta(candidate.status);
  const StatusIcon = meta.icon;
  const positive = POSITIVE_STATUSES.has(candidate.status);
  const copy = getResultCopy(candidate.status);

  useEffect(() => {
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    if (positive && typeof navigator !== "undefined" && typeof navigator.vibrate === "function") {
      navigator.vibrate([80, 45, 120, 45, 180]);
    }
    const onKeyDown = (event) => event.key === "Escape" && onClose();
    window.addEventListener("keydown", onKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [candidate.candidate_id, onClose, positive]);

  return (
    <div className="fixed inset-0 z-[120] flex items-end justify-center sm:items-center sm:p-5" role="dialog" aria-modal="true" aria-label="حالة الترشح">
      <button type="button" onClick={onClose} aria-label="إغلاق" className="absolute inset-0 bg-[#020817]/85 backdrop-blur-lg" />

      <section className={`result-celebration relative z-10 max-h-[94dvh] w-full max-w-xl overflow-y-auto rounded-t-[38px] border shadow-[0_-24px_100px_rgba(0,0,0,.45)] sm:rounded-[38px] ${positive ? "border-emerald-400/25 bg-[#06170f]" : "border-rose-400/20 bg-[#151018]"}`}>
        {positive && (
          <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden="true">
            <div className="absolute left-1/2 top-0 h-64 w-64 -translate-x-1/2 rounded-full bg-emerald-400/20 blur-3xl" />
            {CONFETTI.map(([left, top, color, delay], index) => (
              <span
                key={index}
                className="celebration-confetti absolute h-3 w-2 rounded-sm"
                style={{ left: `${left}%`, top: `${top}%`, backgroundColor: color, animationDelay: `${delay}s` }}
              />
            ))}
          </div>
        )}

        <div className="relative px-5 pb-7 pt-5 sm:px-7 sm:pb-8">
          <div className="flex items-center justify-between gap-3">
            <span className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-black ${positive ? "border-emerald-400/30 bg-emerald-400/10 text-emerald-300" : "border-rose-400/30 bg-rose-400/10 text-rose-300"}`}>
              <StatusIcon className="h-4 w-4" />
              {meta.label}
            </span>
            <button type="button" onClick={onClose} className="grid h-11 w-11 place-items-center rounded-2xl border border-white/10 bg-white/[.08] text-white transition hover:bg-white/15 active:scale-95" aria-label="إغلاق">
              <X className="h-6 w-6" />
            </button>
          </div>

          <div className="mt-7 text-center">
            <div className={`relative mx-auto grid h-24 w-24 place-items-center rounded-full border-[5px] ${positive ? "success-pulse border-emerald-300/80 bg-gradient-to-br from-emerald-300 via-emerald-400 to-green-600 text-white shadow-[0_0_60px_rgba(16,185,129,.45)]" : "border-rose-300/80 bg-gradient-to-br from-rose-400 to-red-600 text-white shadow-[0_0_50px_rgba(244,63,94,.28)]"}`}>
              <StatusIcon className="h-12 w-12" strokeWidth={2.7} />
            </div>
            {positive && <Sparkles className="mx-auto mt-4 h-6 w-6 text-[#f4b916]" />}
            <p className={`mt-3 text-xs font-black tracking-wide ${positive ? "text-emerald-300" : "text-rose-300"}`}>{copy.eyebrow}</p>
            <h2 className="mt-2 text-3xl font-black leading-[1.35] text-white">{copy.title}</h2>
            <p className="mx-auto mt-3 max-w-md text-sm font-bold leading-7 text-slate-300">{copy.body}</p>
          </div>

          <div className={`mt-6 rounded-[28px] border p-5 text-center ${positive ? "border-emerald-400/20 bg-emerald-400/[.07]" : "border-rose-400/20 bg-rose-400/[.07]"}`}>
            <p className="text-[11px] font-black text-slate-400">{competition?.name_ar || "المسابقة"}</p>
            <h3 className="mt-3 text-2xl font-black leading-9 text-white">{candidate.name_ar}</h3>
            {candidate.name_fr && <p dir="ltr" className="mt-1 text-sm font-bold text-slate-400">{candidate.name_fr}</p>}

            <div className="mt-5 grid grid-cols-2 gap-3 text-start">
              <div className="rounded-2xl border border-white/10 bg-white/[.06] p-3.5">
                <span className="block text-[11px] font-bold text-slate-400">رقم الوصل</span>
                <strong dir="ltr" className="mt-1 block text-right text-lg font-black tabular-nums text-white">{candidate.receipt_number}</strong>
              </div>
              <div className="rounded-2xl border border-white/10 bg-white/[.06] p-3.5">
                <span className="block text-[11px] font-bold text-slate-400">التخصص</span>
                <strong className="mt-1 block text-sm font-black leading-6 text-white">{candidate.track_name_ar}</strong>
              </div>
            </div>
          </div>

          {candidate.status === "temporary_rejected" && candidate.rejection_reason && (
            <div className="mt-4 rounded-[24px] border border-rose-400/20 bg-rose-400/[.08] p-4">
              <span className="text-xs font-black text-rose-300">سبب عدم القبول</span>
              <p className="mt-1.5 text-sm font-bold leading-7 text-rose-50">{candidate.rejection_reason}</p>
            </div>
          )}

          {candidate.status === "temporary_accepted" && (
            <div className="mt-4 rounded-[22px] border border-[#f4b916]/25 bg-[#f4b916]/10 p-3 text-center text-xs font-black leading-6 text-amber-100">
              القبول في هذه المرحلة لا يعني القبول النهائي.
            </div>
          )}

          <button type="button" onClick={onClose} className={`mt-5 flex min-h-13 w-full items-center justify-center gap-2 rounded-2xl px-4 py-3.5 text-sm font-black text-white transition active:scale-[.985] ${positive ? "bg-gradient-to-l from-emerald-500 to-green-600 shadow-[0_14px_34px_rgba(16,185,129,.25)]" : "bg-white/10"}`}>
            <Check className="h-5 w-5" />
            تم
          </button>
        </div>
      </section>

      <style jsx>{`
        @keyframes confettiDrop {
          0% { transform: translate3d(0,-18px,0) rotate(0deg); opacity: 0; }
          15% { opacity: 1; }
          100% { transform: translate3d(12px,190px,0) rotate(300deg); opacity: 0; }
        }
        @keyframes successPulse {
          0%, 100% { transform: scale(1); box-shadow: 0 0 0 0 rgba(52,211,153,.18), 0 0 60px rgba(16,185,129,.4); }
          50% { transform: scale(1.055); box-shadow: 0 0 0 18px rgba(52,211,153,0), 0 0 80px rgba(16,185,129,.5); }
        }
        @keyframes modalRise {
          from { transform: translateY(32px) scale(.985); opacity: 0; }
          to { transform: translateY(0) scale(1); opacity: 1; }
        }
        .celebration-confetti { animation: confettiDrop 1.8s ease-out infinite; }
        .success-pulse { animation: successPulse 1.8s ease-in-out infinite; }
        .result-celebration { animation: modalRise .28s cubic-bezier(.2,.8,.2,1) both; }
        @media (prefers-reduced-motion: reduce) {
          .celebration-confetti, .success-pulse, .result-celebration { animation: none !important; }
        }
      `}</style>
    </div>
  );
}

export default function CandidatureSearch() {
  const [competitions, setCompetitions] = useState([]);
  const [competitionSlug, setCompetitionSlug] = useState("");
  const [trackCode, setTrackCode] = useState("");
  const [query, setQuery] = useState("");
  const [suggestions, setSuggestions] = useState([]);
  const [suggesting, setSuggesting] = useState(false);
  const [inputFocused, setInputFocused] = useState(false);
  const [results, setResults] = useState([]);
  const [selectedCandidate, setSelectedCandidate] = useState(null);
  const [loadingCatalog, setLoadingCatalog] = useState(true);
  const [searching, setSearching] = useState(false);
  const [searched, setSearched] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const controller = new AbortController();
    async function loadCatalog() {
      try {
        const response = await fetch("/api/candidatures", { signal: controller.signal });
        const data = await response.json();
        if (!response.ok) throw new Error(data?.error || "تعذر تحميل المسابقات");
        const list = Array.isArray(data?.competitions) ? data.competitions : [];
        setCompetitions(list);
        setCompetitionSlug((current) => current || list[0]?.slug || "");
      } catch (loadError) {
        if (loadError?.name !== "AbortError") setError(loadError?.message || "تعذر تحميل المسابقات حاليًا");
      } finally {
        if (!controller.signal.aborted) setLoadingCatalog(false);
      }
    }
    loadCatalog();
    return () => controller.abort();
  }, []);

  const selectedCompetition = useMemo(
    () => competitions.find((competition) => competition.slug === competitionSlug) || null,
    [competitions, competitionSlug],
  );
  const tracks = Array.isArray(selectedCompetition?.tracks) ? selectedCompetition.tracks : [];
  const detectedMode = inferMode(query.trim());

  useEffect(() => {
    const value = query.trim();
    if (inferMode(value) !== "name" || value.length < 3 || !competitionSlug || !inputFocused) {
      setSuggestions([]);
      setSuggesting(false);
      return undefined;
    }

    const controller = new AbortController();
    const timer = window.setTimeout(async () => {
      setSuggesting(true);
      try {
        const response = await fetch("/api/candidatures", {
          method: "POST",
          signal: controller.signal,
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ competition: competitionSlug, track: trackCode || null, mode: "name", query: value, action: "suggest" }),
        });
        const data = await response.json();
        if (!response.ok) throw new Error();
        setSuggestions(Array.isArray(data?.results) ? data.results : []);
      } catch (suggestionError) {
        if (suggestionError?.name !== "AbortError") setSuggestions([]);
      } finally {
        if (!controller.signal.aborted) setSuggesting(false);
      }
    }, 260);

    return () => {
      window.clearTimeout(timer);
      controller.abort();
    };
  }, [competitionSlug, inputFocused, query, trackCode]);

  function resetOutput() {
    setResults([]);
    setSearched(false);
    setError("");
  }

  function pickSuggestion(candidate) {
    setQuery(candidate.name_ar || "");
    setSuggestions([]);
    setInputFocused(false);
    setResults([]);
    setSearched(true);
    setSelectedCandidate(candidate);
  }

  async function submitSearch(event) {
    event.preventDefault();
    const value = query.trim();
    const mode = inferMode(value);
    resetOutput();
    setSuggestions([]);
    setInputFocused(false);

    if (!competitionSlug) return setError("اختر المسابقة أولًا");
    if (!value) return setError("اكتب الاسم أو رقم الوصل");
    if (mode === "name" && value.length < 3) return setError("اكتب ثلاثة أحرف على الأقل من الاسم");

    setSearching(true);
    try {
      const response = await fetch("/api/candidatures", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ competition: competitionSlug, track: trackCode || null, mode, query: value, action: "search" }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data?.error || "تعذر إكمال البحث");
      const list = Array.isArray(data?.results) ? data.results : [];
      setResults(list);
      setSearched(true);
      if (list.length === 1) setSelectedCandidate(list[0]);
    } catch (searchError) {
      setError(searchError?.message || "تعذر إكمال البحث حاليًا");
    } finally {
      setSearching(false);
    }
  }

  return (
    <div className="space-y-4">
      <section className="rounded-[32px] border border-emerald-900/10 bg-white p-4 shadow-[0_24px_70px_rgba(13,29,53,.08)] sm:p-6 dark:border-emerald-400/15 dark:bg-gradient-to-b dark:from-[#0b261b] dark:to-[#081d16] dark:shadow-[0_24px_70px_rgba(0,0,0,.22)]">
        <div className="mb-4 flex items-start gap-2.5 rounded-[22px] border border-emerald-400/20 bg-emerald-500/[.08] p-3 text-xs font-bold leading-6 text-emerald-900 dark:text-emerald-100">
          <BadgeCheck className="mt-0.5 h-4 w-4 shrink-0 text-emerald-500" />
          <p>الحالة مطابقة لآخر لائحة منشورة، والقبول في هذه المرحلة لا يعني القبول النهائي.</p>
        </div>

        <form onSubmit={submitSearch} className="space-y-4">
          <div className="grid grid-cols-2 gap-2.5">
            <label className="min-w-0">
              <span className="mb-1.5 block text-[11px] font-black text-slate-500 dark:text-slate-300">المسابقة</span>
              <select
                value={competitionSlug}
                onChange={(event) => {
                  setCompetitionSlug(event.target.value);
                  setTrackCode("");
                  setSuggestions([]);
                  resetOutput();
                }}
                disabled={loadingCatalog}
                className="h-12 w-full min-w-0 rounded-2xl border border-slate-200 bg-[#f7f9fc] px-3 text-xs font-black text-slate-900 outline-none transition focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10 disabled:opacity-60 dark:border-white/10 dark:bg-white/[.07] dark:text-white"
              >
                {loadingCatalog && <option value="">جاري التحميل…</option>}
                {!loadingCatalog && competitions.length === 0 && <option value="">لا توجد مسابقات</option>}
                {competitions.map((competition) => <option key={competition.slug} value={competition.slug}>{competition.name_ar}</option>)}
              </select>
            </label>

            <label className="min-w-0">
              <span className="mb-1.5 block text-[11px] font-black text-slate-500 dark:text-slate-300">التخصص</span>
              <select
                value={trackCode}
                onChange={(event) => {
                  setTrackCode(event.target.value);
                  setSuggestions([]);
                  resetOutput();
                }}
                disabled={!competitionSlug || loadingCatalog}
                className="h-12 w-full min-w-0 rounded-2xl border border-slate-200 bg-[#f7f9fc] px-3 text-xs font-black text-slate-900 outline-none transition focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10 disabled:opacity-60 dark:border-white/10 dark:bg-white/[.07] dark:text-white"
              >
                <option value="">كل التخصصات</option>
                {tracks.map((track) => <option key={track.code} value={track.code}>{track.name_ar}</option>)}
              </select>
            </label>
          </div>

          <div className="relative">
            <label className="block">
              <span className="mb-1.5 block text-[11px] font-black text-slate-500 dark:text-slate-300">الاسم أو رقم الوصل</span>
              <div className={`relative rounded-[22px] transition ${inputFocused ? "ring-4 ring-emerald-500/10" : ""}`}>
                <Search className="pointer-events-none absolute right-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
                <input
                  value={query}
                  onChange={(event) => {
                    setQuery(event.target.value);
                    resetOutput();
                  }}
                  onFocus={() => setInputFocused(true)}
                  onBlur={() => window.setTimeout(() => setInputFocused(false), 140)}
                  type="search"
                  inputMode={detectedMode === "receipt" ? "numeric" : "search"}
                  autoComplete="off"
                  placeholder="اكتب الاسم أو رقم الوصل"
                  className="h-15 w-full rounded-[22px] border border-slate-200 bg-[#f9fbfd] pr-12 pl-12 text-base font-black text-[#0d1d35] outline-none transition placeholder:font-semibold placeholder:text-slate-400 focus:border-emerald-500 dark:border-white/10 dark:bg-[#06130e] dark:text-white"
                />
                {suggesting && <LoaderCircle className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 animate-spin text-emerald-400" />}
                {!suggesting && query && (
                  <button type="button" onClick={() => { setQuery(""); setSuggestions([]); resetOutput(); }} className="absolute left-3 top-1/2 grid h-8 w-8 -translate-y-1/2 place-items-center rounded-xl text-slate-400 transition hover:bg-slate-100 dark:hover:bg-white/10" aria-label="مسح">
                    <X className="h-4 w-4" />
                  </button>
                )}
              </div>
            </label>

            {inputFocused && suggestions.length > 0 && (
              <div className="absolute inset-x-0 top-[82px] z-30 overflow-hidden rounded-[22px] border border-slate-200 bg-white shadow-[0_22px_60px_rgba(13,29,53,.18)] dark:border-white/10 dark:bg-[#10261d]">
                {suggestions.map((candidate) => (
                  <button key={candidate.candidate_id} type="button" onMouseDown={(event) => event.preventDefault()} onClick={() => pickSuggestion(candidate)} className="flex w-full items-center gap-3 border-b border-slate-100 px-3.5 py-3 text-start transition last:border-b-0 hover:bg-emerald-50 dark:border-white/[.06] dark:hover:bg-emerald-400/[.08]">
                    <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-emerald-50 text-emerald-600 dark:bg-emerald-400/10 dark:text-emerald-300"><UserRound className="h-4 w-4" /></span>
                    <span className="min-w-0 flex-1">
                      <strong className="block truncate text-sm font-black text-slate-950 dark:text-white">{candidate.name_ar}</strong>
                      <small className="mt-0.5 block truncate text-[11px] font-bold text-slate-400">{candidate.track_name_ar} · رقم الوصل {candidate.receipt_number}</small>
                    </span>
                    <ChevronLeft className="h-4 w-4 shrink-0 text-slate-300" />
                  </button>
                ))}
              </div>
            )}
          </div>

          <button type="submit" disabled={searching || loadingCatalog || !competitionSlug} className="flex min-h-14 w-full items-center justify-center gap-2 rounded-[22px] bg-gradient-to-l from-[#08b766] via-[#10c878] to-[#18d89a] px-5 text-sm font-black text-white shadow-[0_16px_36px_rgba(16,185,129,.28)] transition hover:brightness-105 active:scale-[.985] disabled:cursor-not-allowed disabled:opacity-60">
            {searching ? <LoaderCircle className="h-5 w-5 animate-spin" /> : <Search className="h-5 w-5" />}
            {searching ? "جاري التحقق…" : "تحقق من الحالة"}
          </button>
        </form>

        {error && <div role="alert" className="mt-4 rounded-2xl border border-rose-200 bg-rose-50 p-3 text-sm font-bold text-rose-800 dark:border-rose-400/20 dark:bg-rose-400/[.08] dark:text-rose-200">{error}</div>}
      </section>

      {searched && results.length === 0 && !selectedCandidate && (
        <section className="rounded-[24px] border border-slate-200 bg-white p-6 text-center shadow-sm dark:border-white/10 dark:bg-[#0b1d18]">
          <Search className="mx-auto mb-3 h-9 w-9 text-slate-300 dark:text-slate-600" />
          <h2 className="text-base font-black text-slate-950 dark:text-white">لم نجد ترشحًا مطابقًا</h2>
          <p className="mt-1 text-sm font-semibold leading-6 text-slate-500 dark:text-slate-400">تأكد من الاسم أو رقم الوصل، أو اختر «كل التخصصات» لتوسيع البحث.</p>
        </section>
      )}

      {results.length > 1 && !selectedCandidate && (
        <section className="overflow-hidden rounded-[26px] border border-slate-200 bg-white shadow-[0_16px_48px_rgba(13,29,53,.08)] dark:border-white/10 dark:bg-[#0b1d18]">
          <div className="border-b border-slate-100 px-4 py-3 dark:border-white/[.06]">
            <h2 className="text-sm font-black text-slate-950 dark:text-white">اختر المترشح الصحيح</h2>
            <p className="mt-0.5 text-xs font-semibold text-slate-400">وجدنا {results.length} تطابقات</p>
          </div>
          {results.map((candidate) => (
            <button key={candidate.candidate_id} type="button" onClick={() => setSelectedCandidate(candidate)} className="flex w-full items-center gap-3 border-b border-slate-100 px-4 py-3.5 text-start transition last:border-b-0 hover:bg-emerald-50 dark:border-white/[.06] dark:hover:bg-emerald-400/[.08]">
              <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-emerald-50 text-emerald-600 dark:bg-emerald-400/10 dark:text-emerald-300"><UserRound className="h-4 w-4" /></span>
              <span className="min-w-0 flex-1">
                <strong className="block truncate text-sm font-black text-slate-950 dark:text-white">{candidate.name_ar}</strong>
                <small className="mt-0.5 block truncate text-[11px] font-bold text-slate-400">{candidate.track_name_ar} · رقم الوصل {candidate.receipt_number}</small>
              </span>
              <ChevronLeft className="h-4 w-4 shrink-0 text-slate-300" />
            </button>
          ))}
        </section>
      )}

      {selectedCandidate && (
        <CandidateResultModal candidate={selectedCandidate} competition={selectedCompetition} onClose={() => setSelectedCandidate(null)} />
      )}
    </div>
  );
}
