"use client";

import Link from "next/link";
import { ArrowLeft, Filter, Sparkles } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import {
  ORIENTATION_SOURCE_URL,
  STREAM_ORDER,
  orientationPrograms,
} from "../../data/orientation-programs";
import OrientationComparePanel from "./OrientationComparePanel";
import OrientationFilters from "./OrientationFilters";
import OrientationHighlights from "./OrientationHighlights";
import OrientationProgramCard from "./OrientationProgramCard";
import {
  COMPARE_KEY,
  getFit,
  normalizeStream,
  PAGE_SIZE,
  parseScore,
  readStoredIds,
  SAVED_KEY,
} from "./orientation-utils";

export default function OrientationExplorer({ initialAverage = "", initialStream = "" }) {
  const normalizedInitialStream = normalizeStream(initialStream);
  const validInitialAverage = parseScore(initialAverage) !== null ? String(initialAverage) : "";
  const validInitialStream = STREAM_ORDER.includes(normalizedInitialStream) ? normalizedInitialStream : "";

  const [averageInput, setAverageInput] = useState(validInitialAverage);
  const [stream, setStream] = useState(validInitialStream);
  const [studyType, setStudyType] = useState("");
  const [institution, setInstitution] = useState("");
  const [category, setCategory] = useState("");
  const [query, setQuery] = useState("");
  const [sort, setSort] = useState("recommended");
  const [savedOnly, setSavedOnly] = useState(false);
  const [savedIds, setSavedIds] = useState([]);
  const [compareIds, setCompareIds] = useState([]);
  const [page, setPage] = useState(1);
  const [hydrated, setHydrated] = useState(false);

  const average = parseScore(averageInput);

  useEffect(() => {
    setSavedIds(readStoredIds(SAVED_KEY));
    setCompareIds(readStoredIds(COMPARE_KEY).slice(0, 3));
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (hydrated) localStorage.setItem(SAVED_KEY, JSON.stringify(savedIds));
  }, [hydrated, savedIds]);

  useEffect(() => {
    if (hydrated) localStorage.setItem(COMPARE_KEY, JSON.stringify(compareIds));
  }, [hydrated, compareIds]);

  useEffect(() => {
    setPage(1);
  }, [averageInput, category, institution, query, savedOnly, sort, stream, studyType]);

  const institutions = useMemo(
    () => [...new Set(orientationPrograms.map((program) => program.institution))].sort((a, b) => a.localeCompare(b, "ar")),
    [],
  );

  const categories = useMemo(
    () => [...new Set(orientationPrograms.map((program) => program.category))].sort((a, b) => a.localeCompare(b, "ar")),
    [],
  );

  const filtered = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    const rows = orientationPrograms
      .filter((program) => !stream || program.stream === stream)
      .filter((program) => !studyType || program.studyType === studyType)
      .filter((program) => !institution || program.institution === institution)
      .filter((program) => !category || program.category === category)
      .filter((program) => !savedOnly || savedIds.includes(program.id))
      .filter((program) => {
        if (!normalizedQuery) return true;
        return `${program.name} ${program.institution} ${program.faculty} ${program.category}`
          .toLowerCase()
          .includes(normalizedQuery);
      });

    const statusRank = { strong: 0, possible: 1, difficult: 2, reference: 3 };
    rows.sort((a, b) => {
      if (sort === "score-desc") return b.lastScore - a.lastScore;
      if (sort === "score-asc") return a.lastScore - b.lastScore;
      if (sort === "name") return a.name.localeCompare(b.name, "ar");
      if (Number.isFinite(average)) {
        const fitA = getFit(a, average);
        const fitB = getFit(b, average);
        return statusRank[fitA.key] - statusRank[fitB.key] || b.lastScore - a.lastScore;
      }
      return STREAM_ORDER.indexOf(a.stream) - STREAM_ORDER.indexOf(b.stream) || b.lastScore - a.lastScore;
    });

    return rows;
  }, [average, category, institution, query, savedIds, savedOnly, sort, stream, studyType]);

  const visiblePrograms = filtered.slice(0, page * PAGE_SIZE);
  const highCompetition = useMemo(
    () => [...orientationPrograms].sort((a, b) => b.lastScore - a.lastScore).slice(0, 4),
    [],
  );
  const nouadhibouPrograms = useMemo(
    () => orientationPrograms.filter((program) => program.institution === "جامعة نواذيبو").slice(0, 4),
    [],
  );
  const uniqueInstitutionCount = useMemo(
    () => new Set(orientationPrograms.map((program) => program.institution)).size,
    [],
  );

  function toggleSaved(id) {
    setSavedIds((current) => (current.includes(id) ? current.filter((item) => item !== id) : [...current, id]));
  }

  function toggleCompare(id) {
    setCompareIds((current) => {
      if (current.includes(id)) return current.filter((item) => item !== id);
      if (current.length >= 3) return current;
      return [...current, id];
    });
  }

  function resetFilters() {
    setAverageInput("");
    setStream("");
    setStudyType("");
    setInstitution("");
    setCategory("");
    setQuery("");
    setSort("recommended");
    setSavedOnly(false);
  }

  const showHighlights = !stream && !query && !institution && !category && !savedOnly;

  return (
    <main className="min-h-screen bg-[#f7faf8] pb-28 text-slate-950 dark:bg-[#06110b] dark:text-white">
      <header className="sticky top-0 z-40 border-b border-slate-200/80 bg-white/90 backdrop-blur-xl dark:border-white/10 dark:bg-[#07130d]/90">
        <div className="app-shell flex min-h-14 items-center justify-between gap-3">
          <Link className="inline-flex items-center gap-2 text-sm font-black text-mauri-green" href="/">
            <ArrowLeft className="h-4 w-4 rotate-180" />
            MauriResults
          </Link>
          <span className="rounded-full bg-mauri-green/10 px-3 py-1 text-[11px] font-black text-mauri-green dark:text-emerald-300">
            دليل التوجيه
          </span>
        </div>
      </header>

      <div className="app-shell grid gap-5 py-5 md:gap-8 md:py-10">
        <section className="relative overflow-hidden rounded-[32px] border border-emerald-200/70 bg-white p-5 shadow-premium dark:border-emerald-300/15 dark:bg-white/[.055] md:p-8">
          <div className="absolute -left-16 -top-20 h-56 w-56 rounded-full bg-emerald-200/35 blur-3xl dark:bg-emerald-400/10" aria-hidden="true" />
          <div className="relative grid gap-6 lg:grid-cols-[1.2fr_.8fr] lg:items-end">
            <div>
              <span className="inline-flex items-center gap-2 rounded-full bg-mauri-green/10 px-3 py-1.5 text-xs font-black text-mauri-green dark:text-emerald-300">
                <Sparkles className="h-4 w-4" />
                ماذا يمكنني دراسة بمعدلي؟
              </span>
              <h1 className="mt-4 max-w-3xl text-3xl font-black leading-tight tracking-tight md:text-5xl">
                دليل التخصصات والتوجيه الجامعي
              </h1>
              <p className="mt-3 max-w-2xl text-sm font-bold leading-7 text-slate-600 dark:text-slate-300 md:text-base">
                اختر شعبة الباكالوريا وأدخل معدلك لعرض التخصصات المناسبة اعتماداً على آخر معدلات التوجيه المسجلة.
              </p>
            </div>
            <div className="grid grid-cols-3 gap-2">
              {[
                [orientationPrograms.length, "عرض توجيه"],
                [STREAM_ORDER.length, "شعب باك"],
                [uniqueInstitutionCount, "مؤسسة"],
              ].map(([value, label]) => (
                <div className="rounded-2xl border border-slate-200 bg-slate-50 p-3 text-center dark:border-white/10 dark:bg-white/5" key={label}>
                  <strong className="block text-xl font-black text-mauri-green dark:text-mauri-gold">{value}</strong>
                  <span className="text-[10px] font-black text-slate-500 dark:text-slate-300">{label}</span>
                </div>
              ))}
            </div>
          </div>
        </section>

        <OrientationFilters
          averageInput={averageInput}
          categories={categories}
          category={category}
          institution={institution}
          institutions={institutions}
          onReset={resetFilters}
          query={query}
          savedCount={savedIds.length}
          savedOnly={savedOnly}
          setAverageInput={setAverageInput}
          setCategory={setCategory}
          setInstitution={setInstitution}
          setQuery={setQuery}
          setSavedOnly={setSavedOnly}
          setSort={setSort}
          setStream={setStream}
          setStudyType={setStudyType}
          sort={sort}
          stream={stream}
          studyType={studyType}
        />

        <OrientationComparePanel average={average} compareIds={compareIds} onClear={() => setCompareIds([])} onRemove={toggleCompare} />

        {showHighlights && (
          <OrientationHighlights highCompetition={highCompetition} nouadhibouPrograms={nouadhibouPrograms} />
        )}

        <section className="grid gap-4">
          <div className="flex flex-wrap items-end justify-between gap-3">
            <div>
              <p className="text-xs font-black text-mauri-green dark:text-mauri-gold">
                {Number.isFinite(average) ? "التخصصات حسب فرصتك" : "كل عروض التوجيه"}
              </p>
              <h2 className="text-2xl font-black">{filtered.length} تخصصاً متاحاً</h2>
            </div>
            {compareIds.length >= 3 && (
              <span className="rounded-full bg-amber-50 px-3 py-1.5 text-xs font-black text-amber-700 dark:bg-amber-300/10 dark:text-amber-200">
                وصلت للحد الأقصى للمقارنة
              </span>
            )}
          </div>

          {filtered.length ? (
            <>
              <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                {visiblePrograms.map((program) => (
                  <OrientationProgramCard
                    average={average}
                    compareIds={compareIds}
                    key={program.id}
                    onCompare={toggleCompare}
                    onSave={toggleSaved}
                    program={program}
                    savedIds={savedIds}
                  />
                ))}
              </div>
              {visiblePrograms.length < filtered.length && (
                <button className="mx-auto min-h-12 rounded-2xl border border-mauri-green/25 bg-white px-6 text-sm font-black text-mauri-green shadow-soft transition hover:bg-mauri-green/5 dark:bg-white/5" onClick={() => setPage((value) => value + 1)} type="button">
                  عرض المزيد
                </button>
              )}
            </>
          ) : (
            <div className="rounded-[26px] border border-dashed border-slate-300 bg-white p-8 text-center dark:border-white/15 dark:bg-white/5">
              <Filter className="mx-auto h-10 w-10 text-slate-400" />
              <h3 className="mt-3 text-lg font-black">لا توجد تخصصات بهذه الفلاتر</h3>
              <p className="mt-1 text-sm font-bold text-slate-500 dark:text-slate-300">جرّب تغيير المؤسسة أو المجال أو إلغاء خيار المحفوظة فقط.</p>
            </div>
          )}
        </section>

        <section className="rounded-[26px] border border-amber-200 bg-amber-50 p-4 text-sm font-bold leading-7 text-amber-900 dark:border-amber-300/20 dark:bg-amber-300/10 dark:text-amber-100">
          <strong className="block font-black">تنبيه مهم</strong>
          آخر معدل مسجل هو قيمة تاريخية للاستئناس فقط، وقد يتغير التوجيه حسب عدد المقاعد والمترشحين وترتيب الرغبات. تصنيف الفرص في هذه الصفحة تقديري ولا يضمن القبول.
          <a className="mr-1 font-black underline underline-offset-4" href={ORIENTATION_SOURCE_URL} target="_blank" rel="noopener noreferrer">
            مصدر الإحصائيات
          </a>
        </section>
      </div>
    </main>
  );
}
