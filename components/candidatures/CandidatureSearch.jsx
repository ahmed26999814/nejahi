"use client";

import { useEffect, useMemo, useState } from "react";
import {
  AlertTriangle,
  CheckCircle2,
  ExternalLink,
  Hash,
  LoaderCircle,
  Search,
  UserRound,
  XCircle,
} from "lucide-react";

const STATUS_META = {
  temporary_accepted: {
    label: "مقبول مؤقتًا",
    className: "border-emerald-200 bg-emerald-50 text-emerald-800 dark:border-emerald-800/60 dark:bg-emerald-950/35 dark:text-emerald-200",
    icon: CheckCircle2,
  },
  temporary_rejected: {
    label: "مرفوض مؤقتًا",
    className: "border-rose-200 bg-rose-50 text-rose-800 dark:border-rose-800/60 dark:bg-rose-950/35 dark:text-rose-200",
    icon: XCircle,
  },
  final_accepted: {
    label: "مقبول نهائيًا",
    className: "border-emerald-200 bg-emerald-50 text-emerald-800 dark:border-emerald-800/60 dark:bg-emerald-950/35 dark:text-emerald-200",
    icon: CheckCircle2,
  },
  eligible: {
    label: "مؤهل",
    className: "border-sky-200 bg-sky-50 text-sky-800 dark:border-sky-800/60 dark:bg-sky-950/35 dark:text-sky-200",
    icon: CheckCircle2,
  },
  successful: {
    label: "ناجح",
    className: "border-emerald-200 bg-emerald-50 text-emerald-800 dark:border-emerald-800/60 dark:bg-emerald-950/35 dark:text-emerald-200",
    icon: CheckCircle2,
  },
  waiting_list: {
    label: "لائحة تكميلية",
    className: "border-amber-200 bg-amber-50 text-amber-800 dark:border-amber-800/60 dark:bg-amber-950/35 dark:text-amber-200",
    icon: AlertTriangle,
  },
};

function getStatusMeta(status) {
  return STATUS_META[status] || {
    label: "قيد المتابعة",
    className: "border-slate-200 bg-slate-50 text-slate-700 dark:border-white/10 dark:bg-white/5 dark:text-slate-200",
    icon: AlertTriangle,
  };
}

export default function CandidatureSearch() {
  const [competitions, setCompetitions] = useState([]);
  const [competitionSlug, setCompetitionSlug] = useState("");
  const [trackCode, setTrackCode] = useState("");
  const [mode, setMode] = useState("name");
  const [query, setQuery] = useState("");
  const [results, setResults] = useState([]);
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
        if (loadError?.name !== "AbortError") {
          setError(loadError?.message || "تعذر تحميل المسابقات حاليًا");
        }
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

  function resetResults() {
    setResults([]);
    setSearched(false);
    setError("");
  }

  function switchMode(nextMode) {
    setMode(nextMode);
    setQuery("");
    resetResults();
  }

  async function submitSearch(event) {
    event.preventDefault();
    const value = query.trim();
    resetResults();

    if (!competitionSlug) {
      setError("اختر المسابقة أولًا");
      return;
    }
    if (mode === "name" && value.length < 3) {
      setError("اكتب ثلاثة أحرف على الأقل من الاسم");
      return;
    }
    if (mode === "receipt" && !/^\d+$/.test(value.replace(/\s+/g, ""))) {
      setError("أدخل رقم وصل صحيحًا");
      return;
    }

    setSearching(true);
    try {
      const response = await fetch("/api/candidatures", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          competition: competitionSlug,
          track: trackCode || null,
          mode,
          query: value,
        }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data?.error || "تعذر إكمال البحث");
      setResults(Array.isArray(data?.results) ? data.results : []);
      setSearched(true);
    } catch (searchError) {
      setError(searchError?.message || "تعذر إكمال البحث حاليًا");
    } finally {
      setSearching(false);
    }
  }

  return (
    <div className="space-y-5">
      <section className="rounded-[28px] border border-slate-200/80 bg-white p-4 shadow-[0_16px_48px_rgba(15,23,42,.06)] sm:p-6 dark:border-white/10 dark:bg-[#0b1811]">
        <div className="mb-5 flex items-start gap-3 rounded-2xl border border-amber-200/80 bg-amber-50/80 p-3 text-sm leading-6 text-amber-950 dark:border-amber-900/60 dark:bg-amber-950/25 dark:text-amber-100">
          <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0" />
          <p>الحالة مطابقة للوائح الرسمية المنشورة. «مقبول مؤقتًا» لا تعني القبول النهائي، والتظلمات تُقدَّم عبر الجهة الرسمية فقط.</p>
        </div>

        <form onSubmit={submitSearch} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <label className="col-span-2 sm:col-span-1">
              <span className="mb-1.5 block text-xs font-black text-slate-600 dark:text-slate-300">المسابقة</span>
              <select
                value={competitionSlug}
                onChange={(event) => {
                  setCompetitionSlug(event.target.value);
                  setTrackCode("");
                  resetResults();
                }}
                disabled={loadingCatalog}
                className="h-12 w-full rounded-2xl border border-slate-200 bg-slate-50 px-3 text-sm font-bold text-slate-900 outline-none transition focus:border-mauri-green focus:ring-4 focus:ring-mauri-green/10 disabled:opacity-60 dark:border-white/10 dark:bg-white/5 dark:text-white"
              >
                {loadingCatalog && <option value="">جاري التحميل…</option>}
                {!loadingCatalog && competitions.length === 0 && <option value="">لا توجد مسابقات منشورة</option>}
                {competitions.map((competition) => (
                  <option key={competition.slug} value={competition.slug}>{competition.name_ar}</option>
                ))}
              </select>
            </label>

            <label className="col-span-2 sm:col-span-1">
              <span className="mb-1.5 block text-xs font-black text-slate-600 dark:text-slate-300">التخصص</span>
              <select
                value={trackCode}
                onChange={(event) => {
                  setTrackCode(event.target.value);
                  resetResults();
                }}
                disabled={!competitionSlug || loadingCatalog}
                className="h-12 w-full rounded-2xl border border-slate-200 bg-slate-50 px-3 text-sm font-bold text-slate-900 outline-none transition focus:border-mauri-green focus:ring-4 focus:ring-mauri-green/10 disabled:opacity-60 dark:border-white/10 dark:bg-white/5 dark:text-white"
              >
                <option value="">كل التخصصات</option>
                {tracks.map((track) => (
                  <option key={track.code} value={track.code}>{track.name_ar}</option>
                ))}
              </select>
            </label>
          </div>

          <div>
            <span className="mb-1.5 block text-xs font-black text-slate-600 dark:text-slate-300">طريقة البحث</span>
            <div className="grid grid-cols-2 gap-2 rounded-2xl bg-slate-100 p-1 dark:bg-white/5">
              <button
                type="button"
                onClick={() => switchMode("name")}
                aria-pressed={mode === "name"}
                className={`flex min-h-11 items-center justify-center gap-2 rounded-xl text-sm font-black transition ${mode === "name" ? "bg-white text-mauri-green shadow-sm dark:bg-white/10 dark:text-emerald-300" : "text-slate-500 dark:text-slate-400"}`}
              >
                <UserRound className="h-4 w-4" />
                بالاسم
              </button>
              <button
                type="button"
                onClick={() => switchMode("receipt")}
                aria-pressed={mode === "receipt"}
                className={`flex min-h-11 items-center justify-center gap-2 rounded-xl text-sm font-black transition ${mode === "receipt" ? "bg-white text-mauri-green shadow-sm dark:bg-white/10 dark:text-emerald-300" : "text-slate-500 dark:text-slate-400"}`}
              >
                <Hash className="h-4 w-4" />
                برقم الوصل
              </button>
            </div>
          </div>

          <label className="block">
            <span className="mb-1.5 block text-xs font-black text-slate-600 dark:text-slate-300">{mode === "name" ? "اسم المترشح" : "رقم الوصل"}</span>
            <div className="relative">
              <Search className="pointer-events-none absolute right-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
              <input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                type={mode === "receipt" ? "tel" : "search"}
                inputMode={mode === "receipt" ? "numeric" : "search"}
                autoComplete="off"
                placeholder={mode === "name" ? "مثال: محمد أحمد" : "مثال: 1250"}
                className="h-14 w-full rounded-2xl border border-slate-200 bg-white pr-12 pl-4 text-base font-bold text-slate-950 outline-none transition placeholder:font-medium placeholder:text-slate-400 focus:border-mauri-green focus:ring-4 focus:ring-mauri-green/10 dark:border-white/10 dark:bg-[#07130d] dark:text-white"
              />
            </div>
            {mode === "name" && <small className="mt-1.5 block text-xs font-medium text-slate-500 dark:text-slate-400">يمكن كتابة الاسم كاملًا أو جزءًا منه — ثلاثة أحرف على الأقل.</small>}
          </label>

          <button
            type="submit"
            disabled={searching || loadingCatalog || !competitionSlug}
            className="flex min-h-14 w-full items-center justify-center gap-2 rounded-2xl bg-mauri-green px-5 py-3.5 text-sm font-black text-white shadow-[0_12px_28px_rgba(21,128,61,.22)] transition active:scale-[.985] disabled:cursor-not-allowed disabled:opacity-60"
          >
            {searching ? <LoaderCircle className="h-5 w-5 animate-spin" /> : <Search className="h-5 w-5" />}
            {searching ? "جاري البحث…" : "بحث عن الترشح"}
          </button>
        </form>

        {error && (
          <div role="alert" className="mt-4 rounded-2xl border border-rose-200 bg-rose-50 p-3 text-sm font-bold text-rose-800 dark:border-rose-900/60 dark:bg-rose-950/25 dark:text-rose-200">
            {error}
          </div>
        )}
      </section>

      {searched && results.length === 0 && (
        <section className="rounded-[24px] border border-slate-200 bg-white p-6 text-center shadow-sm dark:border-white/10 dark:bg-[#0b1811]">
          <Search className="mx-auto mb-3 h-9 w-9 text-slate-300 dark:text-slate-600" />
          <h2 className="text-base font-black text-slate-950 dark:text-white">لم نجد ترشحًا مطابقًا</h2>
          <p className="mt-1 text-sm leading-6 text-slate-500 dark:text-slate-400">تأكد من الاسم أو رقم الوصل، أو اختر «كل التخصصات» لتوسيع البحث.</p>
        </section>
      )}

      {results.length > 0 && (
        <section className="space-y-3" aria-live="polite">
          <div className="flex items-center justify-between gap-3 px-1">
            <h2 className="text-base font-black text-slate-950 dark:text-white">التطابقات</h2>
            <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-black text-slate-600 dark:bg-white/5 dark:text-slate-300">{results.length}</span>
          </div>

          {results.map((candidate) => {
            const meta = getStatusMeta(candidate.status);
            const StatusIcon = meta.icon;
            return (
              <article key={candidate.candidate_id} className="rounded-[24px] border border-slate-200/90 bg-white p-4 shadow-[0_12px_32px_rgba(15,23,42,.05)] sm:p-5 dark:border-white/10 dark:bg-[#0b1811]">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <h3 className="text-base font-black leading-7 text-slate-950 dark:text-white">{candidate.name_ar}</h3>
                    {candidate.name_fr && <p dir="ltr" className="mt-0.5 truncate text-left text-xs font-semibold text-slate-400">{candidate.name_fr}</p>}
                  </div>
                  <span className={`inline-flex shrink-0 items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-black ${meta.className}`}>
                    <StatusIcon className="h-4 w-4" />
                    {meta.label}
                  </span>
                </div>

                <div className="mt-4 grid grid-cols-2 gap-2">
                  <div className="rounded-2xl bg-slate-50 p-3 dark:bg-white/5">
                    <span className="block text-[11px] font-bold text-slate-400">رقم الوصل</span>
                    <strong dir="ltr" className="mt-1 block text-right text-sm font-black tabular-nums text-slate-900 dark:text-white">{candidate.receipt_number}</strong>
                  </div>
                  <div className="rounded-2xl bg-slate-50 p-3 dark:bg-white/5">
                    <span className="block text-[11px] font-bold text-slate-400">التخصص</span>
                    <strong className="mt-1 block text-sm font-black text-slate-900 dark:text-white">{candidate.track_name_ar}</strong>
                  </div>
                </div>

                {candidate.status === "temporary_rejected" && candidate.rejection_reason && (
                  <div className="mt-3 rounded-2xl border border-rose-100 bg-rose-50/70 p-3 dark:border-rose-900/40 dark:bg-rose-950/20">
                    <span className="block text-[11px] font-black text-rose-500 dark:text-rose-300">سبب الرفض في اللائحة الرسمية</span>
                    <p className="mt-1 text-sm font-bold leading-6 text-rose-900 dark:text-rose-100">{candidate.rejection_reason}</p>
                  </div>
                )}
              </article>
            );
          })}

          {results.length >= 25 && (
            <p className="px-2 text-center text-xs leading-5 text-slate-500 dark:text-slate-400">ظهرت أول 25 مطابقة. أضف جزءًا آخر من الاسم أو اختر التخصص لتضييق البحث.</p>
          )}
        </section>
      )}

      {selectedCompetition?.source_url && (
        <a
          href={selectedCompetition.source_url}
          target="_blank"
          rel="noreferrer"
          className="flex items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-black text-slate-600 transition hover:border-mauri-green/30 hover:text-mauri-green dark:border-white/10 dark:bg-white/5 dark:text-slate-300"
        >
          المصدر الرسمي — اللجنة الوطنية للمسابقات
          <ExternalLink className="h-4 w-4" />
        </a>
      )}
    </div>
  );
}
