"use client";

import { useEffect, useMemo, useState } from "react";

const PAGE_SIZE = 1000;
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const TABLE = "bac_results";

const EXAM_CARDS = [
  { id: "bac-2025", title: "نتائج باكالوريا 2025", description: "النتائج الرسمية للباكالوريا.", available: true, icon: <GraduationIcon /> },
  { id: "brevet-2026", title: "ختم دروس الإعدادية 2026", description: "سيتم فتحها عند توفر النتائج.", available: false, icon: <BookIcon /> },
  { id: "concours-2026", title: "كونكور 2026", description: "سيتم فتحها عند توفر النتائج.", available: false, icon: <SchoolIcon /> },
  { id: "excellence-secondary-2026", title: "الامتياز - الثانوية 2026", description: "سيتم فتحها عند توفر النتائج.", available: false, icon: <AwardIcon /> },
  { id: "excellence-middle-2026", title: "الامتياز - الإعدادية 2026", description: "سيتم فتحها عند توفر النتائج.", available: false, icon: <AwardIcon /> },
  { id: "bac-session-2025", title: "الباكالوريا الدورة التكميلية 2025", description: "خاص بالمترشحين المؤهلين للدورة.", available: true, filter: "sessionnaire", icon: <AlertIcon /> },
  { id: "bac-2026", title: "نتائج باكالوريا 2026", description: "سيتم فتحها عند توفر النتائج.", available: false, icon: <GraduationIcon /> },
];

function parseAverage(value) {
  if (!value) return 0;
  return Number(String(value).replace(",", ".").trim()) || 0;
}

function cleanText(value) {
  return String(value ?? "").trim();
}

function getColumn(row, ...names) {
  for (const name of names) {
    if (Object.prototype.hasOwnProperty.call(row, name)) return row[name];
  }
  return "";
}

function getAverage(student) {
  return parseAverage(student.MOD);
}

function isMissingSupabaseEnv(error) {
  return error instanceof Error && error.message === "Missing Supabase environment variables.";
}

function getOfficialStatus(value) {
  const normalized = cleanText(value).toLowerCase();
  if (normalized.includes("admis")) return { label: "ناجح", icon: <CheckIcon />, className: "admis" };
  if (normalized.includes("sessionnaire")) return { label: "دورة استدراكية", icon: <AlertIcon />, className: "sessionnaire" };
  if (normalized.includes("absent")) return { label: "غائب", icon: <MinusIcon />, className: "absent" };
  if (normalized.includes("ajourn")) return { label: "راسب", icon: <XIcon />, className: "ajourne" };
  return { label: value ? cleanText(value) : "غير محددة", icon: <InfoIcon />, className: "unknown" };
}

function getAverageTone(average) {
  if (average >= 10) return "success";
  if (average >= 8) return "near";
  if (average >= 4) return "warning";
  return "danger";
}

function getAverageLevel(average) {
  if (average >= 15) return { label: "ممتاز", percent: 100, className: "excellent" };
  if (average >= 12) return { label: "جيد جدًا", percent: 78, className: "very-good" };
  if (average >= 10) return { label: "جيد", percent: 58, className: "good" };
  return { label: "ضعيف", percent: Math.max(12, Math.min(48, average * 4.8)), className: "weak" };
}

function playSuccessTone() {
  if (typeof window === "undefined") return;

  try {
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    if (!AudioContext) return;

    const context = new AudioContext();
    const gain = context.createGain();
    gain.gain.setValueAtTime(0.0001, context.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.045, context.currentTime + 0.03);
    gain.gain.exponentialRampToValueAtTime(0.0001, context.currentTime + 0.36);
    gain.connect(context.destination);

    [523.25, 659.25, 783.99].forEach((frequency, index) => {
      const oscillator = context.createOscillator();
      oscillator.type = "sine";
      oscillator.frequency.setValueAtTime(frequency, context.currentTime + index * 0.08);
      oscillator.connect(gain);
      oscillator.start(context.currentTime + index * 0.08);
      oscillator.stop(context.currentTime + 0.32 + index * 0.04);
    });

    window.setTimeout(() => context.close().catch(() => {}), 520);
  } catch {
    // Some browsers block Web Audio in strict privacy modes.
  }
}

function escapePostgrestValue(value) {
  return String(value).replaceAll("\\", "\\\\").replaceAll(",", "\\,").replaceAll(")", "\\)");
}

async function supabaseRequest(params) {
  if (!SUPABASE_URL || !SUPABASE_KEY) {
    throw new Error("Missing Supabase environment variables.");
  }

  const url = new URL(`${SUPABASE_URL}/rest/v1/${TABLE}`);
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== "") {
      url.searchParams.set(key, value);
    }
  });

  const response = await fetch(url, {
    headers: {
      apikey: SUPABASE_KEY,
      Authorization: `Bearer ${SUPABASE_KEY}`,
      Accept: "application/json",
    },
  });

  if (!response.ok) throw new Error(await response.text());
  return response.json();
}

function prepareStudents(rows) {
  const normalized = rows
    .map((row, index) => {
      const track = cleanText(getColumn(row, "TS", "ts", "Serie", "serie") || "غير محددة");
      return {
        id: String(getColumn(row, "Numero", "numero", "NUMERO", "N", "id") ?? "").trim(),
        name: cleanText(getColumn(row, "NOM", "nom", "Nom", "name") || "اسم غير متوفر"),
        ts: cleanText(getColumn(row, "TS", "ts") || "غير محدد"),
        track,
        MOD: getColumn(row, "MOD", "mod"),
        kr: cleanText(getColumn(row, "KR", "kr") || ""),
        wl: cleanText(getColumn(row, "WL", "wl") || ""),
        ms: cleanText(getColumn(row, "MS", "ms") || ""),
        originalIndex: index,
      };
    })
    .filter((student) => student.id);

  const sorted = [...normalized].sort((a, b) => getAverage(b) - getAverage(a) || a.originalIndex - b.originalIndex);
  sorted.forEach((student, index) => {
    student.rank = index + 1;
  });

  return [...new Map(sorted.map((student) => [student.id, student])).values()];
}

async function fetchAllResults() {
  const rows = [];
  let from = 0;

  while (true) {
    const batch = await supabaseRequest({
      select: "Numero,NOM,TS,MOD,KR,WL,MS",
      limit: PAGE_SIZE,
      offset: from,
    });
    rows.push(...batch);
    if (batch.length < PAGE_SIZE) break;
    from += PAGE_SIZE;
  }

  return prepareStudents(rows);
}

async function searchResults(query) {
  const value = escapePostgrestValue(query);
  const isNumeroSearch = /^[0-9A-Za-z-]+$/.test(query);

  return supabaseRequest({
    select: "Numero,NOM,TS,MOD,KR,WL,MS",
    or: isNumeroSearch ? `(Numero.eq.${value},NOM.ilike.*${value}*)` : "",
    NOM: isNumeroSearch ? "" : `ilike.*${value}*`,
    limit: 20,
  });
}

function calculateStats(students) {
  const total = students.length;
  const averages = students.map((student) => parseAverage(student.MOD));
  const passed = students.filter((student) => getOfficialStatus(student.kr).className === "admis").length;
  const failed = students.filter((student) => getOfficialStatus(student.kr).className === "ajourne").length;
  const highest = total ? Math.max(...averages) : 0;
  const average = total ? averages.reduce((sum, value) => sum + value, 0) / total : 0;
  return { total, passed, failed, highest, average };
}

function summarizeStudents(students, field) {
  const groups = new Map();

  students.forEach((student) => {
    const key = cleanText(student[field]) || "غير محدد";
    const current = groups.get(key) || { label: key, total: 0, passed: 0, sum: 0, highest: 0 };
    const average = getAverage(student);
    current.total += 1;
    current.sum += average;
    current.highest = Math.max(current.highest, average);
    if (getOfficialStatus(student.kr).className === "admis") current.passed += 1;
    groups.set(key, current);
  });

  return [...groups.values()]
    .map((group) => ({
      ...group,
      average: group.total ? group.sum / group.total : 0,
      passRate: group.total ? (group.passed / group.total) * 100 : 0,
    }))
    .sort((a, b) => b.total - a.total || b.average - a.average)
    .slice(0, 10);
}

export default function HomePage() {
  const [students, setStudents] = useState([]);
  const [query, setQuery] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [resultLoading, setResultLoading] = useState(false);
  const [dashboardLoading, setDashboardLoading] = useState(true);
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [resultPageOpen, setResultPageOpen] = useState(false);
  const [matches, setMatches] = useState([]);
  const [theme, setThemeState] = useState("light");
  const [activeView, setActiveView] = useState("home");
  const [selectedExamId, setSelectedExamId] = useState("");

  useEffect(() => {
    const saved = localStorage.getItem("mauriresults-theme");
    const prefersDark = window.matchMedia?.("(prefers-color-scheme: dark)").matches;
    setTheme(saved || (prefersDark ? "dark" : "light"));
    window.history.replaceState({ view: "home" }, "", window.location.pathname);

    fetchAllResults()
      .then(setStudents)
      .catch((error) => setError(isMissingSupabaseEnv(error) ? "لم يتم ضبط متغيرات Supabase في بيئة النشر." : "تعذر تحميل الإحصائيات من Supabase."))
      .finally(() => setDashboardLoading(false));
  }, []);

  useEffect(() => {
    function handlePopState(event) {
      const view = event.state?.view || "home";
      setActiveView(view);
      if (view !== "result") {
        setResultPageOpen(false);
        setSelectedStudent(null);
      }
      window.setTimeout(() => window.scrollTo({ top: 0, behavior: "smooth" }), 0);
    }

    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, []);

  function setTheme(nextTheme) {
    setThemeState(nextTheme);
    document.documentElement.dataset.theme = nextTheme;
    document.documentElement.classList.toggle("dark", nextTheme === "dark");
    localStorage.setItem("mauriresults-theme", nextTheme);
  }

  const tracks = useMemo(() => [...new Set(students.map((student) => student.track).filter(Boolean))].sort((a, b) => a.localeCompare(b, "ar")), [students]);
  const stats = useMemo(() => calculateStats(students), [students]);
  const regionStats = useMemo(() => summarizeStudents(students, "wl"), [students]);
  const trackStats = useMemo(() => summarizeStudents(students, "track"), [students]);
  const schoolStats = useMemo(() => summarizeStudents(students, "ms"), [students]);
  const selectedExam = useMemo(() => EXAM_CARDS.find((exam) => exam.id === selectedExamId), [selectedExamId]);
  const searchPool = useMemo(() => {
    if (selectedExam?.filter === "sessionnaire") {
      return students.filter((student) => getOfficialStatus(student.kr).className === "sessionnaire");
    }
    return students;
  }, [selectedExam, students]);
  const suggestions = useMemo(() => {
    const value = cleanText(query).toLowerCase();
    if (!selectedExam?.available || value.length < 2 || resultPageOpen || matches.length) return [];
    return searchPool
      .filter((student) => cleanText(student.id).toLowerCase().includes(value) || cleanText(student.name).toLowerCase().includes(value))
      .slice(0, 5);
  }, [matches.length, query, resultPageOpen, searchPool, selectedExam]);
  const topperGroups = useMemo(() => tracks
    .map((track) => ({
      track,
      students: students
        .filter((student) => student.track === track)
        .sort((a, b) => getAverage(b) - getAverage(a) || a.originalIndex - b.originalIndex)
        .slice(0, 3),
    }))
    .filter((group) => group.students.length > 0), [students, tracks]);

  function showStudent(student) {
    const known = students.find((item) => item.id === student.id);
    setMatches([]);
    setSelectedStudent(null);
    setResultPageOpen(false);
    setResultLoading(true);
    window.setTimeout(() => {
      setSelectedStudent(known || student);
      setResultLoading(false);
      setResultPageOpen(true);
      setActiveView("result");
      window.history.pushState({ view: "result" }, "", "#result");
      window.scrollTo({ top: 0, behavior: "smooth" });
    }, 520);
  }

  async function handleSubmit(event) {
    event?.preventDefault();
    setError("");
    setMessage("");
    setMatches([]);
    setSelectedStudent(null);
    setResultPageOpen(false);
    setResultLoading(false);

    const value = query.trim();
    if (!value) {
      setError("يرجى إدخال رقم المترشح أو الاسم.");
      return;
    }
    if (value.length < 2) {
      setError("أدخل رقما أو اسما من حرفين على الأقل.");
      return;
    }

    setLoading(true);
    try {
      const rows = await searchResults(value);
      const found = prepareStudents(rows).map((student) => {
        const known = students.find((item) => item.id === student.id);
        return known ? { ...student, rank: known.rank } : student;
      }).filter((student) => selectedExam?.filter === "sessionnaire" ? getOfficialStatus(student.kr).className === "sessionnaire" : true);

      if (!found.length) {
        setError(selectedExam?.filter === "sessionnaire" ? "لم يتم العثور على مترشح مؤهل للدورة بهذا الرقم أو الاسم." : "لم يتم العثور على نتيجة بهذا الرقم أو الاسم.");
        return;
      }

      if (found.length === 1) showStudent(found[0]);
      else setMatches(found);
    } catch (error) {
      setError(isMissingSupabaseEnv(error) ? "لم يتم ضبط متغيرات Supabase في بيئة النشر." : "حدث خطأ أثناء الاتصال بقاعدة البيانات.");
    } finally {
      setLoading(false);
    }
  }

  function shareResult(student) {
    const text = `نتيجة ${student.name}\nرقم المترشح: ${student.id}\nالشعبة: ${student.track}\nالمعدل: ${parseAverage(student.MOD).toFixed(2)}\nالترتيب: ${student.rank || "غير متوفر"}\nMauriResults`;
    if (navigator.share) {
      navigator.share({ title: "MauriResults - نتيجة الامتحان", text }).catch(() => {});
      return;
    }
    navigator.clipboard?.writeText(text);
    setMessage("تم نسخ النتيجة للمشاركة.");
  }

  function selectStudent(student) {
    showStudent(student);
  }

  function openView(view) {
    setActiveView(view);
    if (view !== "result") setResultPageOpen(false);
    window.history.pushState({ view }, "", view === "home" ? window.location.pathname : `#${view}`);
    window.setTimeout(() => window.scrollTo({ top: 0, behavior: "smooth" }), 0);
  }

  return (
    <main className="app-background min-h-screen pb-20 text-mauri-ink dark:text-white md:pb-0">
      <Header activeView={activeView} onNavigate={openView} theme={theme} setTheme={setTheme} />

      {activeView === "home" && (
        <HomeView
          dashboardLoading={dashboardLoading}
          error={error}
          handleSubmit={handleSubmit}
          loading={loading}
          matches={matches}
          message={message}
          onSelectExam={(exam) => {
            setSelectedExamId(exam.id);
            setMatches([]);
            setSelectedStudent(null);
            setResultPageOpen(false);
            setError("");
            setMessage("");
            window.setTimeout(() => document.getElementById("resultArea")?.scrollIntoView({ behavior: "smooth", block: "start" }), 120);
          }}
          onPickSuggestion={(student) => { setQuery(student.id); showStudent(student); }}
          onSelect={selectStudent}
          query={query}
          selectedExam={selectedExam}
          selectedExamId={selectedExamId}
          setQuery={setQuery}
          stats={stats}
          suggestions={suggestions}
        />
      )}

      {activeView === "toppers" && <ToppersPage groups={topperGroups} loading={dashboardLoading} onSelect={selectStudent} />}
      {activeView === "analytics" && <AnalyticsPage loading={dashboardLoading} regionStats={regionStats} schoolStats={schoolStats} stats={stats} trackStats={trackStats} />}
      {activeView === "result" && selectedStudent && <ResultExperience student={selectedStudent} onClose={() => openView("home")} onShare={shareResult} />}

      {activeView !== "result" && <Footer />}
      <BottomNav activeView={activeView} onNavigate={openView} />
      {resultLoading && <ResultLoadingOverlay />}
    </main>
  );
}

function HomeView({ error, handleSubmit, loading, matches, message, onPickSuggestion, onSelect, onSelectExam, query, selectedExam, selectedExamId, setQuery, suggestions }) {
  return (
    <section className="app-shell grid gap-4 pt-4 md:gap-6 md:pt-6">
      <Hero />
      <CompetitionCards onSelectExam={onSelectExam} selectedExamId={selectedExamId} />
      <section className="scroll-mt-20" id="resultArea">
        {selectedExam?.available && (
          <SearchPanel error={error} examTitle={selectedExam.title} handleSubmit={handleSubmit} loading={loading} message={message} onPickSuggestion={onPickSuggestion} query={query} setQuery={setQuery} suggestions={suggestions} />
        )}
        {loading && <ResultLoadingCard />}
        {!loading && matches.length > 0 && <MatchesList matches={matches} onSelect={onSelect} />}
      </section>
    </section>
  );
}

function CompetitionCards({ onSelectExam, selectedExamId }) {
  return (
    <section className="grid grid-cols-2 gap-3">
      {EXAM_CARDS.map((exam) => (
        <button
          className={`exam-card ${selectedExamId === exam.id ? "is-selected" : ""} ${exam.available ? "" : "is-locked"}`}
          key={exam.id}
          onClick={() => exam.available && onSelectExam(exam)}
          type="button"
          disabled={!exam.available}
        >
          <span className="exam-card-icon">{exam.icon}</span>
          <span className="min-w-0 text-start">
            <strong className="block text-base font-black text-slate-950 dark:text-white">{exam.title}</strong>
            <small className="mt-1 block text-xs font-bold leading-5 text-slate-500 dark:text-slate-400">{exam.description}</small>
          </span>
          {!exam.available && <span className="soon-badge">قريبًا</span>}
        </button>
      ))}
    </section>
  );
}

function ToppersPage({ groups, loading, onSelect }) {
  return (
    <section className="app-shell grid gap-4 py-4 md:gap-6 md:py-8">
      <PageHero eyebrow="الأوائل" title="صفحة أوائل الشعب" description="أفضل ثلاثة مترشحين من كل شعبة في عرض سريع ومنظم." icon={<AwardIcon />} />
      <ToppersSection loading={loading} onSelect={onSelect} groups={groups} />
    </section>
  );
}

function AnalyticsPage({ loading, regionStats, schoolStats, stats, trackStats }) {
  return (
    <section className="app-shell grid gap-4 py-4 md:gap-6 md:py-8">
      <PageHero eyebrow="الإحصائيات" title="إحصائيات حسب الولايات والشعب والمدارس" description="لوحة مختصرة تساعد على فهم النتائج بسرعة." icon={<ChartIcon />} />
      <StatsStrip loading={loading} stats={stats} />
      <div className="grid gap-4 lg:grid-cols-2">
        <StatsTable icon={<MapIcon />} loading={loading} rows={regionStats} title="حسب الولايات" />
        <StatsTable icon={<BookIcon />} loading={loading} rows={trackStats} title="حسب الشعب" />
        <div className="lg:col-span-2">
          <StatsTable icon={<SchoolIcon />} loading={loading} rows={schoolStats} title="حسب المدارس" />
        </div>
      </div>
    </section>
  );
}

function PageHero({ description, eyebrow, icon, title }) {
  return (
    <section className="page-hero animate-slide-up">
      <span className="grid h-12 w-12 place-items-center rounded-[18px] bg-mauri-green/10 text-mauri-green dark:bg-emerald-300/10 dark:text-emerald-300">{icon}</span>
      <div>
        <p className="text-xs font-black text-mauri-green dark:text-mauri-gold">{eyebrow}</p>
        <h1 className="text-2xl font-black tracking-tight text-slate-950 dark:text-white md:text-4xl">{title}</h1>
        <p className="mt-1 text-sm font-bold leading-6 text-slate-600 dark:text-slate-300">{description}</p>
      </div>
    </section>
  );
}

function StatsTable({ icon, loading, rows, title }) {
  return (
    <section className="analytics-panel animate-slide-up">
      <div className="mb-3 flex items-center gap-2">
        <span className="grid h-9 w-9 place-items-center rounded-[14px] bg-mauri-green/10 text-mauri-green dark:bg-emerald-300/10 dark:text-emerald-300">{icon}</span>
        <h2 className="text-base font-black text-slate-950 dark:text-white">{title}</h2>
      </div>
      <div className="grid gap-2">
        {loading ? (
          Array.from({ length: 6 }).map((_, index) => <span className="skeleton h-12 rounded-[16px]" key={index} />)
        ) : rows.length ? (
          rows.map((row) => <StatsRow row={row} key={row.label} />)
        ) : (
          <p className="text-sm font-bold text-slate-500 dark:text-slate-400">لا توجد بيانات كافية.</p>
        )}
      </div>
    </section>
  );
}

function StatsRow({ row }) {
  return (
    <article className="analytics-row">
      <div className="min-w-0">
        <strong className="line-clamp-1 block text-sm font-black text-slate-950 dark:text-white">{row.label}</strong>
        <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400">ناجحون {row.passed.toLocaleString("ar-MR")} من {row.total.toLocaleString("ar-MR")}</span>
      </div>
      <div className="text-left">
        <strong className="block text-sm font-black text-mauri-green dark:text-mauri-gold">{row.average.toFixed(2)}</strong>
        <span className="text-[10px] font-black text-slate-400 dark:text-slate-500">{row.passRate.toFixed(1)}%</span>
      </div>
    </article>
  );
}

function Header({ activeView, onNavigate, theme, setTheme }) {
  const navItems = [
    { label: "الرئيسية", view: "home" },
    { label: "الأوائل", view: "toppers" },
    { label: "الإحصائيات", view: "analytics" },
  ];

  return (
    <header className="sticky top-0 z-40 border-b border-mauri-border/80 bg-white/95 backdrop-blur-xl dark:border-white/10 dark:bg-[#07130d]/95">
      <nav className="app-shell flex h-14 items-center justify-between gap-3">
        <button className="flex min-w-0 items-center gap-2.5 text-start" onClick={() => onNavigate("home")} type="button">
          <LogoMark className="h-9 w-9 rounded-[14px]" />
          <span className="min-w-0">
            <strong className="block truncate text-sm font-black tracking-tight">MauriResults</strong>
            <small className="block truncate text-[11px] font-bold text-slate-500 dark:text-slate-400">منصة نتائج الوطنية</small>
          </span>
        </button>
        <div className="hidden items-center gap-2 md:flex">
          {navItems.map((item) => (
            <button className={`nav-link ${activeView === item.view ? "bg-mauri-green/10 text-mauri-green" : ""}`} onClick={() => onNavigate(item.view)} type="button" key={item.view}>
              {item.label}
            </button>
          ))}
        </div>
        <button className="icon-button h-9 w-9" onClick={() => setTheme(theme === "dark" ? "light" : "dark")} type="button" aria-label="تبديل الوضع الليلي">
          {theme === "dark" ? <MoonIcon /> : <SunIcon />}
        </button>
      </nav>
    </header>
  );
}

function Hero() {
  return (
    <section className="compact-hero hero-logo-panel animate-slide-up">
      <LogoMark className="h-28 w-28 rounded-[30px] md:h-36 md:w-36" />
      <div className="grid gap-2 text-center">
        <h1 className="text-2xl font-black leading-tight tracking-tight text-slate-950 dark:text-white sm:text-4xl">نتائج المسابقات الوطنية في موريتانيا</h1>
        <p className="mx-auto max-w-xl text-sm font-bold leading-6 text-slate-600 dark:text-slate-300">اختر المسابقة ثم ابحث عن النتيجة الرسمية بسرعة.</p>
      </div>
    </section>
  );
}

function SearchPanel({ error, examTitle, handleSubmit, loading, message, onPickSuggestion, query, setQuery, suggestions }) {
  const [focused, setFocused] = useState(false);
  const visibleSuggestions = focused && suggestions.length > 0;

  function pickSuggestion(student) {
    setFocused(false);
    onPickSuggestion(student);
  }

  return (
    <form onSubmit={(event) => { setFocused(false); handleSubmit(event); }} className="search-card animate-slide-up">
      <div className="col-span-full flex items-center justify-between gap-2 px-1">
        <span className="text-xs font-black text-mauri-green dark:text-mauri-gold">{examTitle}</span>
        <span className="rounded-full bg-mauri-green/10 px-2.5 py-1 text-[11px] font-black text-mauri-green dark:text-emerald-300">البحث مفتوح</span>
      </div>
      <div className="relative min-w-0 flex-1">
        <label className="relative block">
          <span className="pointer-events-none absolute inset-y-0 right-4 grid place-items-center text-mauri-green dark:text-mauri-gold" aria-hidden="true">
            <SearchIcon />
          </span>
          <input
            className="search-input"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            onBlur={() => window.setTimeout(() => setFocused(false), 140)}
            onFocus={() => setFocused(true)}
            placeholder="أدخل رقم المترشح أو الاسم الكامل"
          />
        </label>
        {visibleSuggestions && (
          <div className="suggestions-panel">
            {suggestions.map((student) => (
              <button className="suggestion-item" key={student.id} onMouseDown={(event) => event.preventDefault()} onClick={() => pickSuggestion(student)} type="button">
                <span className="min-w-0 text-start">
                  <strong className="line-clamp-1 block">{student.name}</strong>
                  <small className="line-clamp-1 text-slate-500 dark:text-slate-400">{student.id} - {student.track}</small>
                </span>
                <span className="rounded-full bg-mauri-green/10 px-2 py-1 text-xs font-black text-mauri-green">{parseAverage(student.MOD).toFixed(2)}</span>
              </button>
            ))}
          </div>
        )}
      </div>
      <button className="tap-button h-12 rounded-[16px] bg-gradient-to-l from-mauri-green via-emerald-600 to-emerald-500 px-5 text-sm font-black text-white shadow-[0_16px_35px_rgba(21,128,61,.22)] transition hover:-translate-y-0.5 hover:shadow-[0_20px_45px_rgba(21,128,61,.28)] active:scale-[.98]" type="submit">
        {loading ? "بحث..." : "بحث"}
      </button>
      {(error || message) && (
        <p className={`col-span-full text-center text-xs font-black md:text-start ${error ? "text-red-600 dark:text-red-300" : "text-mauri-green dark:text-mauri-gold"}`}>{error || message}</p>
      )}
    </form>
  );
}

function StatsStrip({ loading, stats }) {
  const cards = [
    { label: "الطلاب", value: stats.total, icon: <GraduationIcon /> },
    { label: "الناجحون", value: stats.passed, icon: <CheckCircleIcon /> },
    { label: "أعلى معدل", value: stats.highest, decimals: 2, icon: <TrendingIcon /> },
    { label: "المتوسط", value: stats.average, decimals: 2, icon: <ChartIcon /> },
  ];

  return (
    <section className="-mx-1 flex snap-x gap-2 overflow-x-auto px-1 pb-1 md:grid md:grid-cols-4 md:overflow-visible">
      {cards.map((card) => (
        <article className="stat-chip snap-start" key={card.label}>
          <span className="grid h-8 w-8 shrink-0 place-items-center rounded-[12px] bg-mauri-green/10 text-mauri-green dark:bg-emerald-300/10 dark:text-emerald-300">{card.icon}</span>
          <div className="min-w-0">
            {loading ? <span className="skeleton block h-5 w-14" /> : <CountUp decimals={card.decimals || 0} value={card.value} />}
            <span className="block text-[11px] font-black text-slate-500 dark:text-slate-400">{card.label}</span>
          </div>
        </article>
      ))}
    </section>
  );
}

function CountUp({ decimals = 0, value }) {
  const [display, setDisplay] = useState(0);

  useEffect(() => {
    const start = performance.now();
    const duration = 900;
    let frame;

    function tick(now) {
      const progress = Math.min((now - start) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setDisplay(value * eased);
      if (progress < 1) frame = requestAnimationFrame(tick);
    }

    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [value]);

  return <strong className="block text-base font-black text-slate-950 dark:text-white">{decimals ? display.toFixed(decimals) : Math.round(display).toLocaleString("ar-MR")}</strong>;
}

function ResultCard({ student, onShare, verificationCode }) {
  const average = parseAverage(student.MOD);
  const status = getOfficialStatus(student.kr);
  const isPassed = status.className === "admis";
  const isFailed = status.className === "ajourne";
  const isTopRanked = student.rank && student.rank <= 3;
  const tone = isFailed ? "calm" : getAverageTone(average);
  const details = [
    ["رقم المترشح", student.id, <HashIcon key="hash" />],
    ["الشعبة", student.track, <BookIcon key="book" />],
    ["الرتبة", student.rank ? `#${student.rank}` : "غير متوفرة", <AwardIcon key="award" />],
    ["المدرسة", student.ms || "غير متوفرة", <SchoolIcon key="school" />],
    ["الولاية", student.wl || "غير متوفرة", <MapIcon key="map" />],
  ];

  useEffect(() => {
    if (isPassed) playSuccessTone();
  }, [isPassed, student.id]);

  return (
    <article className={`result-modal result-${tone} animate-slide-up`}>
      {isPassed && <Confetti />}
      {isPassed && <span className="success-stamp">ناجح</span>}
      <div className="result-modal-header">
        <div className="min-w-0 flex-1">
          <p className="text-[11px] font-black text-mauri-green dark:text-mauri-gold">بطاقة النتيجة</p>
          <div className="student-name-panel">
            <span className="text-[11px] font-black text-slate-500 dark:text-slate-400">اسم الطالب</span>
            <h2 className="mt-1 text-balance text-2xl font-black leading-tight text-slate-950 dark:text-white md:text-3xl">{student.name}</h2>
            <strong className="mt-3 inline-flex rounded-[18px] bg-mauri-green/10 px-4 py-2 text-3xl font-black text-mauri-green dark:bg-mauri-gold/10 dark:text-mauri-gold">{average.toFixed(2)}</strong>
          </div>
          <div className="mt-2 flex flex-wrap items-center gap-2">
            <span className="rounded-full bg-slate-100 px-3 py-1.5 text-xs font-black text-slate-600 shadow-soft dark:bg-white/10 dark:text-slate-200">تحقق {verificationCode}</span>
            {isTopRanked && (
              <span className="top-rank-badge">
                <GoldMedalIcon />
                من الأوائل #{student.rank}
              </span>
            )}
          </div>
        </div>
      </div>

      {isPassed && (
        <div className="success-banner">
          <AwardIcon />
          <span>تهانينا، تم العثور على نتيجة ناجحة.</span>
        </div>
      )}

      {isFailed && (
        <div className="failure-note">
          <InfoIcon />
          <span>لم يحالفك النجاح هذه المرة. راجع خطتك بهدوء، والفرصة القادمة يمكن أن تكون أفضل.</span>
        </div>
      )}

      <div className="mt-4 grid grid-cols-2 gap-2">
        {details.map(([label, value, icon]) => (
          <InfoTile icon={icon} label={label} value={value} key={label} />
        ))}
      </div>

      <div className="mt-4 grid grid-cols-3 gap-2">
        <ActionButton icon={<ShareIcon />} label="مشاركة" onClick={() => onShare(student)} />
        <ActionButton icon={<DownloadIcon />} label="PDF" onClick={() => window.print()} variant="light" />
        <ActionButton icon={<PrinterIcon />} label="طباعة" onClick={() => window.print()} variant="light" />
      </div>
    </article>
  );
}

function AverageLevelBar({ level }) {
  return (
    <div className={`average-level average-level-${level.className}`}>
      <div className="mb-2 flex items-center justify-between gap-3">
        <span className="text-[11px] font-black text-slate-500 dark:text-slate-400">مستوى المعدل</span>
        <strong className="rounded-full bg-white/80 px-2.5 py-1 text-xs font-black text-slate-900 shadow-soft dark:bg-white/10 dark:text-white">{level.label}</strong>
      </div>
      <div className="average-level-track">
        <span style={{ width: `${level.percent}%` }} />
      </div>
      <div className="mt-1 grid grid-cols-4 text-[10px] font-black text-slate-400 dark:text-slate-500">
        <span>ضعيف</span>
        <span className="text-center">جيد</span>
        <span className="text-center">جيد جدًا</span>
        <span className="text-left">ممتاز</span>
      </div>
    </div>
  );
}

function ResultExperience({ onShare, student }) {
  const status = getOfficialStatus(student.kr);
  const verificationCode = `MR-${student.id}-${String(student.rank || Math.round(getAverage(student) * 100)).padStart(4, "0")}`;

  return (
    <section className="app-shell result-official-page py-4 md:py-8" aria-label="بطاقة النتيجة الرسمية">
      <div className="result-page-shell">
        <header className="official-result-header">
          <div className="flex min-w-0 items-center gap-3">
            <LogoMark className="h-12 w-12 rounded-[18px]" />
            <div className="min-w-0">
              <p className="text-[11px] font-black text-mauri-green dark:text-mauri-gold">MauriResults</p>
              <h1 className="line-clamp-1 text-xl font-black text-slate-950 dark:text-white md:text-3xl">بطاقة النتيجة الرسمية</h1>
              <p className="mt-1 text-xs font-bold text-slate-500 dark:text-slate-400">رقم التحقق: {verificationCode}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className={`official-status-stamp ${status.className}`}>{status.label}</span>
          </div>
        </header>
        <ResultCard student={student} onShare={onShare} verificationCode={verificationCode} />
      </div>
    </section>
  );
}

function InfoTile({ icon, label, value }) {
  return (
    <div className="info-tile">
      <span className="grid h-8 w-8 place-items-center rounded-[12px] bg-mauri-green/10 text-mauri-green dark:bg-emerald-300/10 dark:text-emerald-300">{icon}</span>
      <div className="min-w-0">
        <span className="text-[11px] font-black text-slate-500 dark:text-slate-400">{label}</span>
        <strong className="block overflow-wrap-anywhere text-sm font-black text-slate-950 dark:text-white">{value}</strong>
      </div>
    </div>
  );
}

function StatusBadge({ status }) {
  return (
    <span className={`status-badge ${status.className}`}>
      {status.icon}
      {status.label}
    </span>
  );
}

function MatchesList({ matches, onSelect }) {
  return (
    <section className="result-card animate-slide-up">
      <SectionTitle eyebrow="نتائج البحث" title="اختر المترشح" />
      <div className="mt-3 grid gap-2">
        {matches.map((student) => (
          <button className="match-row" key={student.id} onClick={() => onSelect(student)} type="button">
            <span className="min-w-0 text-start">
              <strong className="line-clamp-1 block font-black text-slate-950 dark:text-white">{student.name}</strong>
              <span className="mt-1 block text-xs font-bold text-slate-500 dark:text-slate-400">رقم {student.id} - {student.track}</span>
            </span>
            <span className="rounded-full bg-mauri-green/10 px-3 py-1 text-sm font-black text-mauri-green">{parseAverage(student.MOD).toFixed(2)}</span>
          </button>
        ))}
      </div>
    </section>
  );
}

function ResultLoadingCard() {
  return (
    <div className="result-modal animate-zoom-in">
      <div className="mb-4 flex items-center gap-3">
        <span className="grid h-11 w-11 place-items-center rounded-[16px] bg-mauri-green/10 text-mauri-green">
          <SearchIcon />
        </span>
        <div>
          <strong className="block text-sm font-black text-slate-950 dark:text-white">جاري تحضير بطاقة النتيجة</strong>
          <span className="text-xs font-bold text-slate-500 dark:text-slate-400">لحظات قليلة...</span>
        </div>
      </div>
      <div className="flex justify-between gap-4">
        <div className="grid flex-1 gap-2">
          <span className="skeleton h-3 w-20" />
          <span className="skeleton h-5 w-3/4" />
          <span className="skeleton h-3 w-32" />
        </div>
        <span className="skeleton h-16 w-20 rounded-[18px]" />
      </div>
      <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-4">
        <span className="skeleton h-11" />
        <span className="skeleton h-11" />
        <span className="skeleton h-11" />
        <span className="skeleton h-11" />
      </div>
    </div>
  );
}

function ResultLoadingOverlay() {
  return (
    <section className="result-page" aria-label="تحميل بطاقة النتيجة">
      <div className="result-page-backdrop" />
      <div className="result-loading-panel animate-zoom-in">
        <span className="mx-auto grid h-14 w-14 place-items-center rounded-[20px] bg-mauri-green/10 text-mauri-green">
          <SearchIcon />
        </span>
        <h2 className="mt-3 text-xl font-black text-slate-950 dark:text-white">جاري فتح بطاقة النتيجة</h2>
        <p className="mt-1 text-sm font-bold text-slate-500 dark:text-slate-400">نحضّر لك صفحة النتيجة الرسمية...</p>
        <div className="mt-5 grid gap-2">
          <span className="skeleton h-4 w-full" />
          <span className="skeleton h-4 w-3/4" />
          <span className="skeleton h-12 w-full rounded-[18px]" />
        </div>
      </div>
    </section>
  );
}

function Confetti() {
  return (
    <div className="confetti-layer" aria-hidden="true">
      {Array.from({ length: 18 }).map((_, index) => (
        <span key={index} style={{ "--i": index }} />
      ))}
    </div>
  );
}

function ToppersSection({ groups, loading, onSelect }) {
  return (
    <section className="grid gap-3">
      <div className="flex items-end justify-between gap-3">
        <SectionTitle eyebrow="الأوائل" title="ثلاثة أوائل من كل شعبة" />
      </div>
      <div className="grid gap-2">
        {loading ? (
          <>
            <TopperSkeleton />
            <TopperSkeleton />
            <TopperSkeleton />
          </>
        ) : groups.length ? (
          groups.map((group) => (
            <section className="track-group" key={group.track}>
              <div className="mb-2 flex items-center justify-between gap-2">
                <h3 className="line-clamp-1 text-sm font-black text-slate-950 dark:text-white">{group.track}</h3>
                <span className="rounded-full bg-mauri-green/10 px-2.5 py-1 text-[11px] font-black text-mauri-green">Top 3</span>
              </div>
              <div className="grid gap-2">
                {group.students.map((student, index) => <TopperCard student={student} index={index} onSelect={onSelect} key={student.id} />)}
              </div>
            </section>
          ))
        ) : (
          <p className="rounded-[18px] border border-mauri-border bg-white p-4 text-sm font-bold text-slate-500 dark:border-white/10 dark:bg-white/10 dark:text-slate-400">لا توجد بيانات كافية لهذه الشعبة.</p>
        )}
      </div>
    </section>
  );
}

function TopperCard({ student, index, onSelect }) {
  const medals = [
    { name: "الأول", className: "bg-[#fff7d6] text-[#8a6500]", icon: <GoldMedalIcon /> },
    { name: "الثاني", className: "bg-slate-100 text-slate-600", icon: <SilverMedalIcon /> },
    { name: "الثالث", className: "bg-[#fff0e5] text-[#9a4f18]", icon: <BronzeMedalIcon /> },
  ];
  const medal = medals[index] || medals[0];

  return (
    <article className="topper-compact">
      <span className={`grid h-10 w-10 shrink-0 place-items-center rounded-[14px] ${medal.className}`}>{medal.icon}</span>
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <strong className="line-clamp-1 text-sm font-black text-slate-950 dark:text-white">{student.name}</strong>
          <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-black text-slate-500 dark:bg-white/10 dark:text-slate-300">{medal.name}</span>
        </div>
        <p className="mt-1 line-clamp-1 text-xs font-bold text-slate-500 dark:text-slate-400">{student.track}</p>
      </div>
      <div className="text-center">
        <strong className="block text-lg font-black text-mauri-green">{parseAverage(student.MOD).toFixed(2)}</strong>
        <button className="text-[11px] font-black text-slate-500 underline-offset-4 hover:text-mauri-green hover:underline" onClick={() => onSelect(student)} type="button">عرض النتيجة</button>
      </div>
    </article>
  );
}

function TopperSkeleton() {
  return (
    <div className="topper-compact">
      <span className="skeleton h-10 w-10 rounded-[14px]" />
      <div className="grid flex-1 gap-2">
        <span className="skeleton h-4 w-2/3" />
        <span className="skeleton h-3 w-1/2" />
      </div>
      <span className="skeleton h-8 w-12" />
    </div>
  );
}

function Footer() {
  const [developerOpen, setDeveloperOpen] = useState(false);

  return (
    <footer id="developer" className="border-t border-mauri-border bg-white py-5 dark:border-white/10 dark:bg-white/5">
      <div className="app-shell grid gap-3 text-center md:text-start">
        <div className="flex flex-col items-center justify-between gap-3 md:flex-row">
          <div className="flex items-center justify-center gap-3 md:justify-start">
          <LogoMark className="h-10 w-10 rounded-[14px]" />
          <div>
            <strong className="block text-base font-black text-slate-950 dark:text-white">MauriResults</strong>
            <span className="text-xs font-bold text-slate-500 dark:text-slate-400">منصة النتائج الوطنية.</span>
          </div>
          </div>
          <button className="developer-button" onClick={() => setDeveloperOpen((value) => !value)} type="button">
            <CodeIcon />
            إعداد وتطوير
          </button>
        </div>
        {developerOpen && (
          <div className="developer-card animate-slide-up">
            <div className="flex items-center gap-3">
              <span className="grid h-11 w-11 place-items-center rounded-[16px] bg-mauri-green text-white">
                <UserIcon />
              </span>
              <div className="min-w-0 text-start">
                <p className="text-[11px] font-black text-mauri-green dark:text-mauri-gold">إعداد وتطوير</p>
                <h3 className="text-base font-black text-slate-950 dark:text-white">Ahmed abdellahi mady</h3>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <a className="developer-link" href="https://www.facebook.com/ahmed.abde.mady" target="_blank" rel="noopener">
                <FacebookIcon />
                فيسبوك
              </a>
              <a className="developer-link" href="https://wa.me/22244881891" target="_blank" rel="noopener">
                <WhatsAppIcon />
                واتساب
              </a>
            </div>
          </div>
        )}
        <p className="text-xs font-bold text-slate-500 dark:text-slate-400">جميع الحقوق محفوظة © MauriResults.</p>
      </div>
    </footer>
  );
}

function BottomNav({ activeView, onNavigate }) {
  const items = [
    { label: "الرئيسية", view: "home", icon: <HomeIcon /> },
    { label: "البحث", view: "home", section: "resultArea", icon: <SearchIcon /> },
    { label: "الأوائل", view: "toppers", icon: <AwardIcon /> },
    { label: "الإحصائيات", view: "analytics", icon: <ChartIcon /> },
  ];

  return (
    <nav className="fixed inset-x-0 bottom-0 z-50 px-3 pb-[max(.55rem,env(safe-area-inset-bottom))] pt-2 md:hidden">
      <div className="mx-auto grid max-w-md grid-cols-4 gap-1 rounded-[24px] border border-white/70 bg-white/[.92] p-1.5 shadow-[0_-14px_40px_rgba(15,23,42,.10)] backdrop-blur-2xl dark:border-white/10 dark:bg-[#07130d]/[.92]">
        {items.map((item) => (
          <button className={`grid justify-items-center gap-1 rounded-[18px] px-2 py-1.5 text-[11px] font-black transition hover:-translate-y-0.5 active:scale-95 ${activeView === item.view && !item.section ? "bg-mauri-green text-white shadow-soft" : "text-slate-500 hover:bg-mauri-green/10 hover:text-mauri-green dark:text-slate-300"}`} onClick={() => { onNavigate(item.view); if (item.section) window.setTimeout(() => document.getElementById(item.section)?.scrollIntoView({ behavior: "smooth", block: "start" }), 120); }} type="button" key={item.label}>
            {item.icon}
            <span>{item.label}</span>
          </button>
        ))}
      </div>
    </nav>
  );
}

function SectionTitle({ eyebrow, title }) {
  return (
    <div>
      <p className="text-[11px] font-black text-mauri-green dark:text-mauri-gold">{eyebrow}</p>
      <h2 className="text-lg font-black tracking-tight text-slate-950 dark:text-white">{title}</h2>
    </div>
  );
}

function ActionButton({ icon, label, onClick, variant = "solid" }) {
  const className = variant === "solid" ? "action-button bg-gradient-to-l from-mauri-green via-emerald-600 to-emerald-500 text-white shadow-[0_16px_35px_rgba(21,128,61,.20)] hover:shadow-[0_20px_45px_rgba(21,128,61,.28)]" : "action-button border border-mauri-border bg-white/85 text-slate-700 hover:border-mauri-green/40 hover:text-mauri-green dark:border-white/10 dark:bg-white/10 dark:text-slate-100";
  return (
    <button className={className} onClick={onClick} type="button">
      {icon}
      {label}
    </button>
  );
}

function LogoMark({ className = "h-10 w-10" }) {
  return (
    <span className={`${className} grid shrink-0 place-items-center overflow-hidden border border-mauri-green/10 bg-white shadow-soft dark:border-white/10`}>
      <img className="h-full w-full object-contain p-1" src="/logo.png" alt="MauriResults" loading="eager" />
    </span>
  );
}

function SearchIcon() { return <svg viewBox="0 0 24 24"><circle cx="11" cy="11" r="7" /><path d="m16.5 16.5 4 4" /></svg>; }
function SunIcon() { return <svg viewBox="0 0 24 24"><path d="M12 4V2M12 22v-2M4.9 4.9 3.5 3.5M20.5 20.5l-1.4-1.4M4 12H2M22 12h-2M4.9 19.1l-1.4 1.4M20.5 3.5l-1.4 1.4" /><circle cx="12" cy="12" r="4" /></svg>; }
function MoonIcon() { return <svg viewBox="0 0 24 24"><path d="M20 15.5A8.5 8.5 0 0 1 8.5 4 7 7 0 1 0 20 15.5Z" /></svg>; }
function GraduationIcon() { return <svg viewBox="0 0 24 24"><path d="m3 10 9-5 9 5-9 5-9-5Z" /><path d="M7 12v5c3 2 7 2 10 0v-5" /><path d="M21 10v6" /></svg>; }
function CheckCircleIcon() { return <svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="9" /><path d="m8 12 2.5 2.5L16 9" /></svg>; }
function CheckIcon() { return <svg viewBox="0 0 24 24"><path d="M20 6 9 17l-5-5" /></svg>; }
function XIcon() { return <svg viewBox="0 0 24 24"><path d="M18 6 6 18M6 6l12 12" /></svg>; }
function MinusIcon() { return <svg viewBox="0 0 24 24"><path d="M5 12h14" /></svg>; }
function AlertIcon() { return <svg viewBox="0 0 24 24"><path d="M12 8v5" /><path d="M12 17h.01" /><path d="M10.3 3.9 2.7 17a2 2 0 0 0 1.7 3h15.2a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0Z" /></svg>; }
function InfoIcon() { return <svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="9" /><path d="M12 11v5" /><path d="M12 8h.01" /></svg>; }
function UserIcon() { return <svg viewBox="0 0 24 24"><path d="M20 21a8 8 0 0 0-16 0" /><circle cx="12" cy="8" r="4" /></svg>; }
function HashIcon() { return <svg viewBox="0 0 24 24"><path d="M5 9h14M4 15h14M10 3 8 21M16 3l-2 18" /></svg>; }
function AwardIcon() { return <svg viewBox="0 0 24 24"><circle cx="12" cy="8" r="6" /><path d="M8.2 13 7 22l5-3 5 3-1.2-9" /></svg>; }
function ChartIcon() { return <svg viewBox="0 0 24 24"><path d="M4 19V5M8 17v-6M13 17V7M18 17v-9M3 19h18" /></svg>; }
function TrendingIcon() { return <svg viewBox="0 0 24 24"><path d="m4 16 6-6 4 4 6-8" /><path d="M14 6h6v6" /></svg>; }
function BookIcon() { return <svg viewBox="0 0 24 24"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" /><path d="M4 4.5A2.5 2.5 0 0 1 6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5Z" /></svg>; }
function SchoolIcon() { return <svg viewBox="0 0 24 24"><path d="m3 10 9-5 9 5-9 5-9-5Z" /><path d="M7 12v5c3 2 7 2 10 0v-5" /><path d="M21 10v6" /></svg>; }
function MapIcon() { return <svg viewBox="0 0 24 24"><path d="M9 18 3 21V6l6-3 6 3 6-3v15l-6 3-6-3Z" /><path d="M9 3v15M15 6v15" /></svg>; }
function FacebookIcon() { return <svg viewBox="0 0 24 24"><path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3Z" /></svg>; }
function WhatsAppIcon() { return <svg viewBox="0 0 24 24"><path d="M3 21l1.5-4.4A8.5 8.5 0 1 1 7.4 19L3 21Z" /><path d="M9 9.5c.2 3 2.5 5.1 5.4 5.6l1.1-1.1c.3-.3.3-.8-.1-1l-1.5-.8c-.3-.2-.7-.1-.9.2l-.4.5c-.9-.4-1.6-1.1-2.1-2l.5-.4c.3-.2.4-.6.2-.9l-.8-1.5c-.2-.4-.7-.4-1-.1L9 9.5Z" /></svg>; }
function MessageIcon() { return <svg viewBox="0 0 24 24"><path d="M21 15a4 4 0 0 1-4 4H8l-5 3V7a4 4 0 0 1 4-4h10a4 4 0 0 1 4 4Z" /></svg>; }
function DownloadIcon() { return <svg viewBox="0 0 24 24"><path d="M12 3v12" /><path d="m7 10 5 5 5-5" /><path d="M5 21h14" /></svg>; }
function PrinterIcon() { return <svg viewBox="0 0 24 24"><path d="M6 9V3h12v6" /><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2" /><path d="M6 14h12v7H6Z" /></svg>; }
function ShareIcon() { return <svg viewBox="0 0 24 24"><circle cx="18" cy="5" r="3" /><circle cx="6" cy="12" r="3" /><circle cx="18" cy="19" r="3" /><path d="m8.6 10.5 6.8-4" /><path d="m8.6 13.5 6.8 4" /></svg>; }
function CodeIcon() { return <svg viewBox="0 0 24 24"><path d="m8 9-4 3 4 3" /><path d="m16 9 4 3-4 3" /><path d="m14 4-4 16" /></svg>; }
function HomeIcon() { return <svg viewBox="0 0 24 24"><path d="m3 11 9-8 9 8" /><path d="M5 10v10h14V10" /><path d="M10 20v-6h4v6" /></svg>; }
function GoldMedalIcon() { return <svg viewBox="0 0 24 24"><circle cx="12" cy="13" r="5" /><path d="m8 2 4 6 4-6" /><path d="M12 11v4" /><path d="M10 13h4" /></svg>; }
function SilverMedalIcon() { return <svg viewBox="0 0 24 24"><circle cx="12" cy="13" r="5" /><path d="m8 2 4 6 4-6" /><path d="M10 12a2 2 0 0 1 4 0c0 2-4 2-4 4h4" /></svg>; }
function BronzeMedalIcon() { return <svg viewBox="0 0 24 24"><circle cx="12" cy="13" r="5" /><path d="m8 2 4 6 4-6" /><path d="M10 11h4l-2 2a2 2 0 1 1-2 2" /></svg>; }

