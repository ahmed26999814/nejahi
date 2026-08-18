"use client";

import { useEffect, useMemo, useState } from "react";
import {
  AlertTriangle,
  BadgeCheck,
  CheckCircle2,
  ChevronLeft,
  ExternalLink,
  FileText,
  Hash,
  LoaderCircle,
  Search,
  Sparkles,
  UserRound,
  X,
  XCircle,
} from "lucide-react";

const POSITIVE_STATUSES = new Set(["temporary_accepted", "final_accepted", "eligible", "successful"]);

const STATUS_META = {
  temporary_accepted: { label: "مقبول مؤقتًا", tone: "emerald", icon: CheckCircle2 },
  temporary_rejected: { label: "مرفوض مؤقتًا", tone: "rose", icon: XCircle },
  final_accepted: { label: "مقبول نهائيًا", tone: "emerald", icon: BadgeCheck },
  eligible: { label: "مؤهل", tone: "sky", icon: CheckCircle2 },
  successful: { label: "ناجح", tone: "emerald", icon: BadgeCheck },
  waiting_list: { label: "لائحة تكميلية", tone: "amber", icon: AlertTriangle },
};

function getStatusMeta(status) {
  return STATUS_META[status] || { label: "قيد المتابعة", tone: "slate", icon: AlertTriangle };
}

function resultCopy(status) {
  if (status === "successful") return { title: "ألف مبروك! أنت ناجح 🎉", body: "نتمنى لك مزيدًا من النجاح والتوفيق في خطوتك القادمة." };
  if (status === "final_accepted") return { title: "تهانينا! تم قبولك نهائيًا 🎉", body: "تابع الجهة الرسمية لمعرفة موعد وخطوات المرحلة التالية." };
  if (status === "eligible") return { title: "مبروك! أنت مؤهل للمرحلة التالية ✨", body: "راجع إعلان الجهة الرسمية لمعرفة التفاصيل والمواعيد القادمة." };
  if (status === "temporary_accepted") return { title: "مبروك! ملفك مقبول مؤقتًا 🎉", body: "أنت ضمن اللائحة المؤقتة. تابع الجهة الرسمية لأي تحديثات أو إجراءات لاحقة." };
  if (status === "waiting_list") return { title: "أنت ضمن اللائحة التكميلية", body: "تابع الجهة الرسمية لأن وضعية اللائحة قد تتغير حسب الإجراءات اللاحقة." };
  if (status === "temporary_rejected") return { title: "ملفك غير مقبول مؤقتًا", body: "راجع سبب الرفض أدناه، ويمكنك متابعة إجراءات التظلم عبر الجهة الرسمية إذا كانت متاحة." };
  return { title: "حالة ملفك", body: "هذه هي آخر حالة منشورة رسميًا لهذا الترشح." };
}

function CandidateResultModal({ candidate, competition, onClose }) {
  const meta = getStatusMeta(candidate.status);
  const StatusIcon = meta.icon;
  const positive = POSITIVE_STATUSES.has(candidate.status);
  const copy = resultCopy(candidate.status);

  useEffect(() => {
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKeyDown = (event) => {
      if (event.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-[100] flex items-end justify-center sm:items-center sm:p-5" role="dialog" aria-modal="true" aria-label="حالة الترشح">
      <button type="button" onClick={onClose} aria-label="إغلاق" className="absolute inset-0 bg-slate-950/70 backdrop-blur-md" />

      <section className="relative z-10 max-h-[92dvh] w-full max-w-xl overflow-y-auto rounded-t-[34px] border border-white/10 bg-white shadow-[0_-20px_80px_rgba(2,6,23,.28)] sm:rounded-[34px] dark:bg-[#07150d]">
        <div className={`relative overflow-hidden px-5 pb-6 pt-5 sm:px-7 ${positive ? "bg-[radial-gradient(circle_at_top,_rgba(34,197,94,.19),_transparent_55%)]" : "bg-[radial-gradient(circle_at_top,_rgba(244,63,94,.14),_transparent_55%)]"}`}>
          {positive && (
            <div aria-hidden="true" className="pointer-events-none absolute inset-0 overflow-hidden">
              <span className="absolute left-[9%] top-[22%] h-2 w-4 rotate-12 rounded-sm bg-amber-400/80" />
              <span className="absolute left-[18%] top-[52%] h-3 w-2 -rotate-12 rounded-sm bg-emerald-400/70" />
              <span className="absolute right-[12%] top-[28%] h-2 w-4 -rotate-12 rounded-sm bg-yellow-300/80" />
              <span className="absolute right-[20%] top-[58%] h-3 w-2 rotate-12 rounded-sm bg-emerald-300/70" />
            </div>
          )}

          <div className="relative flex items-center justify-between gap-3">
            <span className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-black ${positive ? "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-500/25 dark:bg-emerald-400/10 dark:text-emerald-300" : "border-rose-200 bg-rose-50 text-rose-700 dark:border-rose-500/25 dark:bg-rose-400/10 dark:text-rose-300"}`}>
              <StatusIcon className="h-4 w-4" />
              {meta.label}
            </span>
            <button type="button" onClick={onClose} className="grid h-10 w-10 place-items-center rounded-2xl border border-slate-200 bg-white/90 text-slate-600 shadow-sm transition active:scale-95 dark:border-white/10 dark:bg-white/10 dark:text-white" aria-label="إغلاق">
              <X className="h-5 w-5" />
            </button>
          </div>

          <div className="relative mt-7 text-center">
            <div className={`mx-auto grid h-20 w-20 place-items-center rounded-full border-[5px] shadow-[0_16px_40px_rgba(15,23,42,.12)] ${positive ? "border-emerald-100 bg-emerald-500 text-white ring-8 ring-emerald-500/10 dark:border-emerald-900" : "border-rose-100 bg-rose-500 text-white ring-8 ring-rose-500/10 dark:border-rose-900"}`}>
              <StatusIcon className="h-10 w-10" strokeWidth={2.4} />
            </div>
            {positive && <Sparkles className="mx-auto mt-3 h-5 w-5 text-amber-400" />}
            <p className="mt-3 text-xs font-black text-slate-400">{competition?.name_ar || "المسابقة"}</p>
            <h2 className="mt-2 text-2xl font-black leading-9 text-slate-950 dark:text-white">{candidate.name_ar}</h2>
            {candidate.name_fr && <p dir="ltr" className="mt-1 text-sm font-semibold text-slate-400">{candidate.name_fr}</p>}
          </div>
        </div>

        <div className="px-5 pb-6 sm:px-7 sm:pb-7">
          <div className={`rounded-[26px] border p-5 text-center ${positive ? "border-emerald-200/80 bg-emerald-50/70 dark:border-emerald-500/20 dark:bg-emerald-400/[.07]" : "border-rose-200/80 bg-rose-50/70 dark:border-rose-500/20 dark:bg-rose-400/[.07]"}`}>
            <h3 className={`text-xl font-black ${positive ? "text-emerald-700 dark:text-emerald-300" : "text-rose-700 dark:text-rose-300"}`}>{copy.title}</h3>
            <p className="mx-auto mt-2 max-w-md text-sm font-semibold leading-7 text-slate-600 dark:text-slate-300">{copy.body}</p>
          </div>

          <div className="mt-4 grid grid-cols-2 gap-3">
            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-3.5 dark:border-white/10 dark:bg-white/[.05]">
              <span className="text-[11px] font-bold text-slate-400">رقم الوصل</span>
              <strong dir="ltr" className="mt-1 block text-right text-base font-black tabular-nums text-slate-950 dark:text-white">{candidate.receipt_number}</strong>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-3.5 dark:border-white/10 dark:bg-white/[.05]">
              <span className="text-[11px] font-bold text-slate-400">التخصص</span>
              <strong className="mt-1 block text-sm font-black leading-6 text-slate-950 dark:text-white">{candidate.track_name_ar}</strong>
            </div>
          </div>

          {candidate.status === "temporary_rejected" && candidate.rejection_reason && (
            <div className="mt-4 rounded-[22px] border border-rose-200 bg-rose-50 p-4 dark:border-rose-500/20 dark:bg-rose-400/[.07]">
              <span className="text-xs font-black text-rose-600 dark:text-rose-300">سبب الرفض في اللائحة الرسمية</span>
              <p className="mt-1.5 text-sm font-bold leading-7 text-rose-950 dark:text-rose-100">{candidate.rejection_reason}</p>
            </div>
          )}

          <div className="mt-4 rounded-2xl border border-amber-200/80 bg-amber-50/80 p-3 text-xs font-bold leading-6 text-amber-900 dark:border-amber-500/20 dark:bg-amber-400/[.07] dark:text-amber-100">
            {candidate.status === "temporary_accepted" ? "تنبيه: القبول المؤقت لا يعني القبول النهائي." : "الحالة المعروضة مبنية على آخر لائحة رسمية منشورة."}
          </div>

          {competition?.source_url && (
            <a href={competition.source_url} target="_blank" rel="noreferrer" className="mt-4 flex min-h-12 items-center justify-center gap-2 rounded-2xl bg-mauri-green px-4 text-sm font-black text-white shadow-[0_12px_30px_rgba(21,128,61,.22)] transition active:scale-[.985]">
              فتح المصدر الرسمي
              <ExternalLink className="h-4 w-4" />
            </a>
          )}
        </div>
      </section>
    </div>
  );
}

export default function CandidatureSearch() {
  const [competitions, setCompetitions] = useState([]);
  const [competitionSlug, setCompetitionSlug] = useState("");
  const [trackCode, setTrackCode] = useState("");
  const [mode, setMode] = useState("name");
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

  useEffect(() => {
    const value = query.trim();
    if (mode !== "name" || value.length < 3 || !competitionSlug || !inputFocused) {
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
    }, 280);

    return () => {
      window.clearTimeout(timer);
      controller.abort();
    };
  }, [competitionSlug, inputFocused, mode, query, trackCode]);

  function resetOutput() {
    setResults([]);
    setSearched(false);
    setError("");
  }

  function switchMode(nextMode) {
    setMode(nextMode);
    setQuery("");
    setSuggestions([]);
    setInputFocused(false);
    resetOutput();
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
    resetOutput();
    setSuggestions([]);
    setInputFocused(false);

    if (!competitionSlug) return setError("اختر المسابقة أولًا");
    if (mode === "name" && value.length < 3) return setError("اكتب ثلاثة أحرف على الأقل من الاسم");
    if (mode === "receipt" && !/^\d+$/.test(value.replace(/\s+/g, ""))) return setError("أدخل رقم وصل صحيحًا");

    setSearching(true);
    try {
      const response = await fetch("/api/candidatures", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ competition: competitionSlug, track: trackCode || null, mode, query: value, action: "search" }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data?.error || "تعذر إكمال البحث");
      const rows = Array.isArray(data?.results) ? data.results : [];
      setResults(rows);
      setSearched(true);
      if (rows.length === 1) setSelectedCandidate(rows[0]);
    } catch (searchError) {
      setError(searchError?.message || "تعذر إكمال البحث حاليًا");
    } finally {
      setSearching(false);
    }
  }

  const showSuggestions = mode === "name" && inputFocused && query.trim().length >= 3 && (suggesting || suggestions.length > 0);

  return (
    <>
      <section className="rounded-[30px] border border-slate-200/80 bg-white/95 p-4 shadow-[0_24px_70px_rgba(15,23,42,.07)] sm:p-6 dark:border-white/10 dark:bg-[#0a1a11]/95">
        <div className="mb-4 flex items-start gap-2.5 rounded-2xl border border-emerald-200/70 bg-emerald-50/70 p-3 text-xs font-bold leading-6 text-emerald-950 dark:border-emerald-500/20 dark:bg-emerald-400/[.07] dark:text-emerald-100">
          <BadgeCheck className="mt-0.5 h-4 w-4 shrink-0 text-mauri-green" />
          <p>الحالة مطابقة لآخر لائحة رسمية منشورة. «مقبول مؤقتًا» لا تعني القبول النهائي.</p>
        </div>

        <form onSubmit={submitSearch} className="space-y-4">
          <div className="grid grid-cols-2 gap-2.5">
            <label className="min-w-0">
              <span className="mb-1.5 block text-[11px] font-black text-slate-500 dark:text-slate-300">المسابقة</span>
              <select
                value={competitionSlug}
                onChange={(event) => { setCompetitionSlug(event.target.value); setTrackCode(""); resetOutput(); }}
                disabled={loadingCatalog}
                className="h-12 w-full min-w-0 rounded-2xl border border-slate-200 bg-slate-50 px-3 text-xs font-black text-slate-900 outline-none transition focus:border-mauri-green focus:ring-4 focus:ring-mauri-green/10 disabled:opacity-60 dark:border-white/10 dark:bg-white/[.05] dark:text-white"
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
                onChange={(event) => { setTrackCode(event.target.value); resetOutput(); }}
                disabled={!competitionSlug || loadingCatalog}
                className="h-12 w-full min-w-0 rounded-2xl border border-slate-200 bg-slate-50 px-3 text-xs font-black text-slate-900 outline-none transition focus:border-mauri-green focus:ring-4 focus:ring-mauri-green/10 disabled:opacity-60 dark:border-white/10 dark:bg-white/[.05] dark:text-white"
              >
                <option value="">كل التخصصات</option>
                {tracks.map((track) => <option key={track.code} value={track.code}>{track.name_ar}</option>)}
              </select>
            </label>
          </div>

          <div className="grid grid-cols-2 gap-1 rounded-2xl border border-slate-200 bg-slate-100 p-1 dark:border-white/10 dark:bg-white/[.05]">
            <button type="button" onClick={() => switchMode("name")} aria-pressed={mode === "name"} className={`flex min-h-11 items-center justify-center gap-2 rounded-xl text-sm font-black transition ${mode === "name" ? "bg-white text-mauri-green shadow-sm dark:bg-emerald-400/10 dark:text-emerald-300" : "text-slate-500 dark:text-slate-400"}`}><UserRound className="h-4 w-4" />بالاسم</button>
            <button type="button" onClick={() => switchMode("receipt")} aria-pressed={mode === "receipt"} className={`flex min-h-11 items-center justify-center gap-2 rounded-xl text-sm font-black transition ${mode === "receipt" ? "bg-white text-mauri-green shadow-sm dark:bg-emerald-400/10 dark:text-emerald-300" : "text-slate-500 dark:text-slate-400"}`}><Hash className="h-4 w-4" />برقم الوصل</button>
          </div>

          <div className="relative">
            <label className="block">
              <span className="mb-1.5 block text-[11px] font-black text-slate-500 dark:text-slate-300">{mode === "name" ? "اكتب اسم المترشح" : "أدخل رقم الوصل"}</span>
              <div className={`relative rounded-2xl transition ${showSuggestions ? "z-30" : ""}`}>
                <Search className="pointer-events-none absolute right-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
                <input
                  value={query}
                  onChange={(event) => { setQuery(event.target.value); resetOutput(); }}
                  onFocus={() => setInputFocused(true)}
                  onBlur={() => window.setTimeout(() => setInputFocused(false), 120)}
                  type={mode === "receipt" ? "tel" : "search"}
                  inputMode={mode === "receipt" ? "numeric" : "search"}
                  autoComplete="off"
                  placeholder={mode === "name" ? "مثال: أحمدو مفتاح عبد الله" : "مثال: 1538"}
                  className="h-14 w-full rounded-2xl border border-slate-200 bg-white pr-12 pl-12 text-base font-black text-slate-950 outline-none transition placeholder:font-semibold placeholder:text-slate-400 focus:border-mauri-green focus:ring-4 focus:ring-mauri-green/10 dark:border-white/10 dark:bg-[#06130c] dark:text-white"
                />
                {query && <button type="button" onMouseDown={(event) => event.preventDefault()} onClick={() => { setQuery(""); setSuggestions([]); resetOutput(); }} className="absolute left-3 top-1/2 grid h-8 w-8 -translate-y-1/2 place-items-center rounded-full text-slate-400 hover:bg-slate-100 dark:hover:bg-white/10" aria-label="مسح"><X className="h-4 w-4" /></button>}
              </div>
            </label>

            {showSuggestions && (
              <div className="absolute left-0 right-0 top-[82px] z-40 overflow-hidden rounded-[22px] border border-slate-200 bg-white shadow-[0_24px_70px_rgba(15,23,42,.18)] dark:border-white/10 dark:bg-[#0d1d14]">
                {suggesting && suggestions.length === 0 ? (
                  <div className="flex items-center justify-center gap-2 px-4 py-5 text-sm font-bold text-slate-500 dark:text-slate-300"><LoaderCircle className="h-4 w-4 animate-spin" />جاري البحث عن اقتراحات…</div>
                ) : suggestions.map((candidate) => {
                  const meta = getStatusMeta(candidate.status);
                  const CandidateIcon = meta.icon;
                  return (
                    <button key={candidate.candidate_id} type="button" onMouseDown={(event) => event.preventDefault()} onClick={() => pickSuggestion(candidate)} className="flex w-full items-center gap-3 border-b border-slate-100 px-4 py-3 text-right transition last:border-0 hover:bg-emerald-50/70 active:bg-emerald-50 dark:border-white/[.07] dark:hover:bg-emerald-400/[.06]">
                      <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-emerald-50 text-mauri-green dark:bg-emerald-400/10 dark:text-emerald-300"><CandidateIcon className="h-5 w-5" /></span>
                      <span className="min-w-0 flex-1">
                        <strong className="block truncate text-sm font-black text-slate-950 dark:text-white">{candidate.name_ar}</strong>
                        <small className="mt-0.5 block truncate text-xs font-semibold text-slate-400">{candidate.track_name_ar} · وصل {candidate.receipt_number}</small>
                      </span>
                      <ChevronLeft className="h-4 w-4 shrink-0 text-slate-300" />
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          <button type="submit" disabled={searching || loadingCatalog || !competitionSlug} className="flex min-h-14 w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-l from-mauri-green to-emerald-500 px-5 text-sm font-black text-white shadow-[0_14px_34px_rgba(21,128,61,.24)] transition active:scale-[.985] disabled:cursor-not-allowed disabled:opacity-60">
            {searching ? <LoaderCircle className="h-5 w-5 animate-spin" /> : <Search className="h-5 w-5" />}
            {searching ? "جاري التحقق…" : "تحقق من الحالة"}
          </button>
        </form>

        {error && <div role="alert" className="mt-4 rounded-2xl border border-rose-200 bg-rose-50 p-3 text-sm font-bold text-rose-800 dark:border-rose-500/20 dark:bg-rose-400/[.07] dark:text-rose-200">{error}</div>}
      </section>

      {searched && results.length === 0 && !selectedCandidate && (
        <div className="mt-4 rounded-[22px] border border-slate-200 bg-white p-5 text-center shadow-sm dark:border-white/10 dark:bg-[#0a1a11]">
          <FileText className="mx-auto h-8 w-8 text-slate-300" />
          <h2 className="mt-2 text-sm font-black text-slate-950 dark:text-white">لم نجد ترشحًا مطابقًا</h2>
          <p className="mt-1 text-xs font-semibold leading-6 text-slate-500 dark:text-slate-400">جرّب جزءًا آخر من الاسم أو ابحث في كل التخصصات.</p>
        </div>
      )}

      {results.length > 1 && (
        <section className="mt-4 overflow-hidden rounded-[26px] border border-slate-200 bg-white shadow-sm dark:border-white/10 dark:bg-[#0a1a11]" aria-live="polite">
          <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3 dark:border-white/[.07]">
            <h2 className="text-sm font-black text-slate-950 dark:text-white">اختر المترشح الصحيح</h2>
            <span className="rounded-full bg-slate-100 px-2.5 py-1 text-[11px] font-black text-slate-500 dark:bg-white/10 dark:text-slate-300">{results.length}</span>
          </div>
          {results.map((candidate) => {
            const meta = getStatusMeta(candidate.status);
            const CandidateIcon = meta.icon;
            return (
              <button key={candidate.candidate_id} type="button" onClick={() => setSelectedCandidate(candidate)} className="flex w-full items-center gap-3 border-b border-slate-100 px-4 py-3 text-right transition last:border-0 hover:bg-slate-50 dark:border-white/[.07] dark:hover:bg-white/[.04]">
                <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-slate-100 text-slate-500 dark:bg-white/10 dark:text-slate-300"><CandidateIcon className="h-5 w-5" /></span>
                <span className="min-w-0 flex-1"><strong className="block truncate text-sm font-black text-slate-950 dark:text-white">{candidate.name_ar}</strong><small className="mt-0.5 block truncate text-xs font-semibold text-slate-400">{candidate.track_name_ar} · وصل {candidate.receipt_number}</small></span>
                <ChevronLeft className="h-4 w-4 shrink-0 text-slate-300" />
              </button>
            );
          })}
          {results.length >= 25 && <p className="border-t border-slate-100 px-4 py-3 text-center text-[11px] font-semibold leading-5 text-slate-400 dark:border-white/[.07]">اكتب جزءًا إضافيًا من الاسم لتضييق النتائج.</p>}
        </section>
      )}

      {selectedCandidate && <CandidateResultModal candidate={selectedCandidate} competition={selectedCompetition} onClose={() => setSelectedCandidate(null)} />}
    </>
  );
}
