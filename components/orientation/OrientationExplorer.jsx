"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import {
  ArrowLeft,
  ArrowRight,
  Building2,
  Filter,
  GraduationCap,
  LayoutGrid,
  Sparkles,
  Target,
} from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  ORIENTATION_SOURCE_URL,
  STREAM_ORDER,
  orientationPrograms,
} from "../../data/orientation-programs";
import OrientationComparePanel from "./OrientationComparePanel";
import OrientationFacultyCard from "./OrientationFacultyCard";
import OrientationFilters from "./OrientationFilters";
import OrientationProgramCard from "./OrientationProgramCard";
import {
  COMPARE_KEY,
  getFit,
  normalizeStream,
  parseScore,
  readStoredIds,
  SAVED_KEY,
} from "./orientation-utils";

function facultyKey(program) {
  return `${program.institution}|||${program.faculty || program.institution}`;
}

export default function OrientationExplorer() {
  const searchParams = useSearchParams();
  const initialAverage = searchParams.get("average") || "";
  const initialStream = searchParams.get("stream") || "";
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
  const [hydrated, setHydrated] = useState(false);
  const [submitted, setSubmitted] = useState(hasInitialData);
  const [advancedOpen, setAdvancedOpen] = useState(false);
  const [formError, setFormError] = useState("");
  const [selectedFacultyKey, setSelectedFacultyKey] = useState("");
  const [showAmbitious, setShowAmbitious] = useState(false);
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

  const availablePrograms = useMemo(
    () => filtered.filter((program) => getFit(program, average).key !== "difficult"),
    [average, filtered],
  );
  const strongProgramsCount = useMemo(
    () => filtered.filter((program) => getFit(program, average).key === "strong").length,
    [average, filtered],
  );
  const ambitiousProgramsCount = Math.max(0, filtered.length - availablePrograms.length);

  const facultyGroups = useMemo(() => {
    const programs = showAmbitious ? filtered : availablePrograms;
    const groups = new Map();

    programs.forEach((program) => {
      const key = facultyKey(program);
      if (!groups.has(key)) {
        groups.set(key, {
          key,
          faculty: program.faculty || program.institution,
          institution: program.institution,
          country: program.country,
          studyType: program.studyType,
          programs: [],
          categories: new Set(),
          minimumScore: program.lastScore,
          strongCount: 0,
          possibleCount: 0,
        });
      }

      const group = groups.get(key);
      const fit = getFit(program, average);
      group.programs.push(program);
      group.categories.add(program.category);
      group.minimumScore = Math.min(group.minimumScore, program.lastScore);
      if (fit.key === "strong") group.strongCount += 1;
      if (fit.key === "possible") group.possibleCount += 1;
    });

    return [...groups.values()]
      .map((group) => ({ ...group, categories: [...group.categories] }))
      .sort((a, b) =>
        b.strongCount - a.strongCount ||
        b.programs.length - a.programs.length ||
        a.minimumScore - b.minimumScore ||
        a.faculty.localeCompare(b.faculty, "ar"),
      );
  }, [availablePrograms, average, filtered, showAmbitious]);

  const selectedFaculty = useMemo(
    () => facultyGroups.find((faculty) => faculty.key === selectedFacultyKey) || null,
    [facultyGroups, selectedFacultyKey],
  );

  useEffect(() => {
    if (selectedFacultyKey && !selectedFaculty) setSelectedFacultyKey("");
  }, [selectedFaculty, selectedFacultyKey]);

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
    setSelectedFacultyKey("");
    setShowAmbitious(false);
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
    setSelectedFacultyKey("");
    setShowAmbitious(false);
    window.setTimeout(() => resultsRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }), 80);
  }

  function editStudentData() {
    setSubmitted(false);
    setAdvancedOpen(false);
    setFormError("");
    setSelectedFacultyKey("");
    setShowAmbitious(false);
  }

  function openFaculty(key) {
    setSelectedFacultyKey(key);
    window.setTimeout(() => resultsRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }), 60);
  }

  function returnToFaculties() {
    setSelectedFacultyKey("");
    window.setTimeout(() => resultsRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }), 60);
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
        <section className="relative flex min-w-0 items-start gap-3 overflow-hidden rounded-[26px] border border-emerald-200/70 bg-white p-4 shadow-soft dark:border-emerald-300/15 dark:bg-white/[.055] md:p-5">
          <span className="pointer-events-none absolute -left-10 -top-14 h-40 w-40 rounded-full bg-emerald-100/70 blur-3xl dark:bg-emerald-400/10" aria-hidden="true" />
          <span className="relative grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-mauri-green text-white shadow-[0_10px_26px_rgba(21,128,61,.22)]">
            <GraduationCap className="h-5 w-5" />
          </span>
          <div className="relative min-w-0">
            <h1 className="text-xl font-black leading-7 md:text-2xl">اعرف الكليات والتخصصات المناسبة لك</h1>
            <p className="mt-1 text-sm font-bold leading-6 text-slate-500 dark:text-slate-300">
              أدخل الشعبة والمعدل، ثم اختر كلية لتظهر تخصصاتها المناسبة مرتبة حسب فرصة القبول.
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
          <div className="grid min-w-0 scroll-mt-20 gap-4" ref={resultsRef}>
            {!selectedFaculty ? (
              <>
                <section className="grid grid-cols-3 gap-2.5">
                  <article className="rounded-[20px] border border-emerald-200/70 bg-emerald-50 p-3 text-center dark:border-emerald-300/15 dark:bg-emerald-300/10">
                    <LayoutGrid className="mx-auto h-5 w-5 text-emerald-700 dark:text-emerald-200" />
                    <strong className="mt-1 block text-2xl font-black text-emerald-800 dark:text-emerald-100">{facultyGroups.length}</strong>
                    <span className="text-[11px] font-black text-emerald-700 dark:text-emerald-200">كلية مناسبة</span>
                  </article>
                  <article className="rounded-[20px] border border-slate-200/80 bg-white p-3 text-center dark:border-white/10 dark:bg-white/[.055]">
                    <Target className="mx-auto h-5 w-5 text-mauri-green" />
                    <strong className="mt-1 block text-2xl font-black text-slate-900 dark:text-white">{availablePrograms.length}</strong>
                    <span className="text-[11px] font-black text-slate-500 dark:text-slate-300">تخصص متاح</span>
                  </article>
                  <article className="rounded-[20px] border border-amber-200/80 bg-amber-50 p-3 text-center dark:border-amber-300/15 dark:bg-amber-300/10">
                    <Sparkles className="mx-auto h-5 w-5 text-amber-700 dark:text-amber-200" />
                    <strong className="mt-1 block text-2xl font-black text-amber-800 dark:text-amber-100">{strongProgramsCount}</strong>
                    <span className="text-[11px] font-black text-amber-700 dark:text-amber-200">فرصة قوية</span>
                  </article>
                </section>

                <section className="grid min-w-0 gap-3">
                  <div className="flex min-w-0 flex-wrap items-end justify-between gap-2">
                    <div className="min-w-0">
                      <p className="text-xs font-black text-mauri-green dark:text-mauri-gold">الخطوة الثانية</p>
                      <h2 className="mt-0.5 text-xl font-black">اختر الكلية</h2>
                      <p className="mt-1 text-sm font-bold leading-6 text-slate-500 dark:text-slate-300">
                        اضغط على أي كلية لعرض التخصصات المناسبة لمعدلك داخلها.
                      </p>
                    </div>
                    {showAmbitious && (
                      <button className="min-h-10 rounded-xl border border-slate-200 bg-white px-3 text-sm font-black text-slate-600 dark:border-white/10 dark:bg-white/5 dark:text-slate-200" onClick={() => setShowAmbitious(false)} type="button">
                        المناسبة فقط
                      </button>
                    )}
                  </div>

                  {facultyGroups.length ? (
                    <div className="grid min-w-0 gap-3 sm:grid-cols-2 xl:grid-cols-3">
                      {facultyGroups.map((faculty) => (
                        <OrientationFacultyCard faculty={faculty} key={faculty.key} onSelect={openFaculty} />
                      ))}
                    </div>
                  ) : (
                    <div className="rounded-[26px] border border-dashed border-slate-300 bg-white p-7 text-center dark:border-white/15 dark:bg-white/5">
                      <Filter className="mx-auto h-9 w-9 text-slate-400" />
                      <h3 className="mt-3 text-lg font-black">لا توجد كليات ضمن المعدل والفلاتر الحالية</h3>
                      <p className="mx-auto mt-1 max-w-md text-sm font-bold leading-6 text-slate-500 dark:text-slate-300">
                        يمكنك مسح الفلاتر أو الاطلاع على الخيارات الطموحة القريبة من معدلك.
                      </p>
                      <div className="mt-4 flex flex-wrap justify-center gap-2">
                        <button className="min-h-10 rounded-xl bg-mauri-green px-4 text-sm font-black text-white" onClick={resetAdvancedFilters} type="button">
                          مسح الفلاتر
                        </button>
                        {ambitiousProgramsCount > 0 && (
                          <button className="min-h-10 rounded-xl border border-amber-200 bg-amber-50 px-4 text-sm font-black text-amber-700 dark:border-amber-300/20 dark:bg-amber-300/10 dark:text-amber-200" onClick={() => setShowAmbitious(true)} type="button">
                            عرض الخيارات الطموحة
                          </button>
                        )}
                      </div>
                    </div>
                  )}

                  {!showAmbitious && facultyGroups.length > 0 && ambitiousProgramsCount > 0 && (
                    <button className="mx-auto min-h-11 rounded-2xl border border-amber-200 bg-amber-50 px-5 text-sm font-black text-amber-700 transition hover:bg-amber-100 dark:border-amber-300/20 dark:bg-amber-300/10 dark:text-amber-200" onClick={() => setShowAmbitious(true)} type="button">
                      عرض {ambitiousProgramsCount} تخصصاً طموحاً إضافياً
                    </button>
                  )}
                </section>
              </>
            ) : (
              <section className="grid min-w-0 gap-4">
                <button className="inline-flex min-h-10 w-fit items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 text-sm font-black text-slate-600 shadow-soft transition hover:border-mauri-green hover:text-mauri-green dark:border-white/10 dark:bg-white/5 dark:text-slate-200" onClick={returnToFaculties} type="button">
                  <ArrowRight className="h-4 w-4" />
                  كل الكليات
                </button>

                <section className="relative overflow-hidden rounded-[28px] border border-emerald-200/70 bg-white p-4 shadow-soft dark:border-emerald-300/15 dark:bg-white/[.055] md:p-5">
                  <span className="pointer-events-none absolute -left-12 -top-16 h-44 w-44 rounded-full bg-emerald-100/70 blur-3xl dark:bg-emerald-400/10" aria-hidden="true" />
                  <div className="relative flex min-w-0 items-start gap-3">
                    <span className="grid h-12 w-12 shrink-0 place-items-center rounded-[18px] bg-mauri-green text-white shadow-[0_10px_24px_rgba(21,128,61,.22)]">
                      <Building2 className="h-6 w-6" />
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-black text-mauri-green dark:text-mauri-gold">تخصصات الكلية</p>
                      <h2 className="mt-1 text-2xl font-black leading-8">{selectedFaculty.faculty}</h2>
                      <p className="mt-1 text-sm font-bold leading-6 text-slate-500 dark:text-slate-300">{selectedFaculty.institution}</p>
                    </div>
                    <span className="shrink-0 rounded-2xl bg-mauri-green/10 px-3 py-2 text-center text-mauri-green dark:text-emerald-300">
                      <strong className="block text-xl font-black">{selectedFaculty.programs.length}</strong>
                      <small className="text-[10px] font-black">تخصص</small>
                    </span>
                  </div>
                </section>

                <OrientationComparePanel average={average} compareIds={compareIds} onClear={() => setCompareIds([])} onRemove={toggleCompare} />

                <div className="flex min-w-0 flex-wrap items-center justify-between gap-2">
                  <div>
                    <h3 className="text-xl font-black">التخصصات المناسبة لمعدلك</h3>
                    <p className="mt-1 text-sm font-bold text-slate-500 dark:text-slate-300">
                      مرتبة من الأقرب إلى معدلك، ويمكنك حفظها أو مقارنتها.
                    </p>
                  </div>
                  {compareIds.length >= 3 && (
                    <span className="rounded-xl bg-amber-50 px-3 py-2 text-sm font-black text-amber-700 dark:bg-amber-300/10 dark:text-amber-200">
                      اخترت 3 للمقارنة
                    </span>
                  )}
                </div>

                <div className="grid min-w-0 gap-3 sm:grid-cols-2 xl:grid-cols-3">
                  {selectedFaculty.programs.map((program) => (
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
              </section>
            )}

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
