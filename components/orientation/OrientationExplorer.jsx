"use client";

import Link from "next/link";
import { ArrowLeft, Filter, GraduationCap } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  ORIENTATION_SOURCE_URL,
  STREAM_ORDER,
  orientationPrograms,
} from "../../data/orientation-programs";
import OrientationComparePanel from "./OrientationComparePanel";
import OrientationFilters from "./OrientationFilters";
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
  const parsedInitialAverage = parseScore(initialAverage);
  const validInitialAverage = Number.isFinite(parsedInitialAverage) && parsedInitialAverage >= 0 && parsedInitialAverage <= 20
    ? String(initialAverage)
    : "";
  const validInitialStream = STREAM_ORDER.includes(normalizedInitialStream) ? normalizedInitialStream : "";
  const hasInitialData = Boolean(validInitialStream && validInitialAverage);

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
  const [submitted, setSubmitted] = useState(hasInitialData);
  const [advancedOpen, setAdvancedOpen] = useState(false);
  const [formError, setFormError] = useState("");
  const resultsRef = useRef(null);

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
    if (!submitted) return [];

    const normalizedQuery = query.trim().toLowerCase();
    const rows = orientationPrograms
      .filter((program) => program.stream === stream)
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
      const fitA = getFit(a, average);
      const fitB = getFit(b, average);
      return statusRank[fitA.key] - statusRank[fitB.key] || b.lastScore - a.lastScore;
    });

    return rows;
  }, [average, category, institution, query, savedIds, savedOnly, sort, stream, studyType, submitted]);

  const visiblePrograms = filtered.slice(0, page * PAGE_SIZE);

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

  function resetAdvancedFilters() {
    setStudyType("");
    setInstitution("");
    setCategory("");
    setQuery("");
    setSort("recommended");
    setSavedOnly(false);
  }

  function submitStudentData(event) {
    event.preventDefault();
    const parsedAverage = parseScore(averageInput);

    if (!stream) {
      setFormError("اختر شعبة الباك أولاً.");
      return;
    }
    if (!Number.isFinite(parsedAverage) || parsedAverage < 0 || parsedAverage > 20) {
      setFormError("أدخل معدلاً صحيحاً بين 0 و20.");
      return;
    }

    setFormError("");
    setSubmitted(true);
    setAdvancedOpen(false);
    window.setTimeout(() => resultsRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }), 80);
  }

  function editStudentData() {
    setSubmitted(false);
    setAdvancedOpen(false);
    setFormError("");
  }

  return (
    <main className="min-h-screen w-full overflow-x-clip bg-[#f7faf8] pb-16 text-slate-950 dark:bg-[#06110b] dark:text-white">
      <header className="sticky top-0 z-40 border-b border-slate-200/80 bg-white/95 backdrop-blur-xl dark:border-white/10 dark:bg-[#07130d]/95">
        <div className="app-shell flex min-h-14 min-w-0 items-center justify-between gap-3">
          <Link className="inline-flex min-w-0 items-center gap-2 text-sm font-black text-mauri-green" href="/">
            <ArrowLeft className="h-4 w-4 rotate-180" />
            <span className="truncate">MauriResults</span>
          </Link>
          <strong className="text-sm font-black text-slate-700 dark:text-slate-100">دليل التوجيه</strong>
        </div>
      </header>

      <div className="app-shell grid w-full min-w-0 gap-4 overflow-hidden py-4 md:gap-6 md:py-8">
        <section className="flex min-w-0 items-start gap-3 rounded-[24px] border border-emerald-200/70 bg-white p-4 shadow-soft dark:border-emerald-300/15 dark:bg-white/[.055]">
          <span className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-mauri-green text-white">
            <GraduationCap className="h-5 w-5" />
          </span>
          <div className="min-w-0">
            <h1 className="text-xl font-black leading-7 md:text-2xl">التخصصات المناسبة لمعدلك</h1>
            <p className="mt-1 text-sm font-bold leading-6 text-slate-500 dark:text-slate-300">
              اختر الشعبة والمعدل، ثم شاهد الخيارات الأقرب إليك.
            </p>
          </div>
        </section>

        <OrientationFilters
          advancedOpen={advancedOpen}
          averageInput={averageInput}
          categories={categories}
          category={category}
          formError={formError}
          institution={institution}
          institutions={institutions}
          onEdit={editStudentData}
          onReset={resetAdvancedFilters}
          onSubmit={submitStudentData}
          query={query}
          savedCount={savedIds.length}
          savedOnly={savedOnly}
          setAdvancedOpen={setAdvancedOpen}
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
          submitted={submitted}
        />

        {submitted && (
          <div className="grid min-w-0 gap-4" ref={resultsRef}>
            <OrientationComparePanel average={average} compareIds={compareIds} onClear={() => setCompareIds([])} onRemove={toggleCompare} />

            <section className="grid min-w-0 gap-3">
              <div className="flex min-w-0 flex-wrap items-center justify-between gap-2">
                <div className="min-w-0">
                  <h2 className="text-xl font-black">التخصصات المتاحة</h2>
                  <p className="mt-0.5 text-sm font-bold text-slate-500 dark:text-slate-300">
                    {filtered.length} خياراً مرتبة حسب قربها من معدلك
                  </p>
                </div>
                {compareIds.length >= 3 && (
                  <span className="rounded-xl bg-amber-50 px-3 py-2 text-sm font-black text-amber-700 dark:bg-amber-300/10 dark:text-amber-200">
                    اخترت 3 للمقارنة
                  </span>
                )}
              </div>

              {filtered.length ? (
                <>
                  <div className="grid min-w-0 gap-3 sm:grid-cols-2 xl:grid-cols-3">
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
                    <button className="mx-auto min-h-11 rounded-2xl border border-mauri-green/25 bg-white px-6 text-sm font-black text-mauri-green shadow-soft transition hover:bg-mauri-green/5 dark:bg-white/5" onClick={() => setPage((value) => value + 1)} type="button">
                      عرض المزيد
                    </button>
                  )}
                </>
              ) : (
                <div className="rounded-[24px] border border-dashed border-slate-300 bg-white p-7 text-center dark:border-white/15 dark:bg-white/5">
                  <Filter className="mx-auto h-9 w-9 text-slate-400" />
                  <h3 className="mt-3 text-lg font-black">لا توجد تخصصات بهذه الفلاتر</h3>
                  <button className="mt-3 min-h-10 rounded-xl bg-mauri-green px-4 text-sm font-black text-white" onClick={resetAdvancedFilters} type="button">
                    مسح الفلاتر
                  </button>
                </div>
              )}
            </section>

            <section className="rounded-[22px] border border-amber-200 bg-amber-50 p-4 text-sm font-bold leading-6 text-amber-900 dark:border-amber-300/20 dark:bg-amber-300/10 dark:text-amber-100">
              المعدلات السابقة للاستئناس فقط، وتتغير حسب المقاعد والمترشحين وترتيب الرغبات.
              <a className="mr-1 font-black underline underline-offset-4" href={ORIENTATION_SOURCE_URL} target="_blank" rel="noopener noreferrer">
                المصدر
              </a>
            </section>
          </div>
        )}
      </div>
    </main>
  );
}
