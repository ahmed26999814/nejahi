"use client";

import { useEffect, useMemo, useState } from "react";

const PAGE_SIZE = 1000;
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const TABLE = "bac_results";

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

function getAverageMessage(average) {
  if (average >= 15 && average <= 20) return "نتيجة ممتازة تعكس جهدا واضحا.";
  if (average >= 13) return "أداء قوي ومشرف.";
  if (average >= 10) return "مبروك النجاح.";
  if (average >= 9) return "قريب جدا من النجاح.";
  if (average >= 8) return "واصل العمل، الفرصة ما زالت أمامك.";
  if (average >= 6) return "تحتاج إلى مراجعة أعمق وخطة أوضح.";
  if (average >= 4) return "يمكنك العودة بشكل أفضل مع تنظيم المراجعة.";
  if (average >= 2) return "ابدأ من الأساسيات وخذ وقتك في التحضير.";
  return "كل بداية صعبة، والمهم أن تبدأ من جديد.";
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

export default function HomePage() {
  const [students, setStudents] = useState([]);
  const [query, setQuery] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [dashboardLoading, setDashboardLoading] = useState(true);
  const [selectedTrack, setSelectedTrack] = useState("all");
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [matches, setMatches] = useState([]);
  const [theme, setThemeState] = useState("light");

  useEffect(() => {
    const saved = localStorage.getItem("mauriresults-theme");
    const prefersDark = window.matchMedia?.("(prefers-color-scheme: dark)").matches;
    setTheme(saved || (prefersDark ? "dark" : "light"));

    fetchAllResults()
      .then(setStudents)
      .catch((error) => setError(isMissingSupabaseEnv(error) ? "لم يتم ضبط متغيرات Supabase في بيئة النشر." : "تعذر تحميل الإحصائيات من Supabase."))
      .finally(() => setDashboardLoading(false));
  }, []);

  function setTheme(nextTheme) {
    setThemeState(nextTheme);
    document.documentElement.dataset.theme = nextTheme;
    document.documentElement.classList.toggle("dark", nextTheme === "dark");
    localStorage.setItem("mauriresults-theme", nextTheme);
  }

  const stats = useMemo(() => calculateStats(students), [students]);
  const tracks = useMemo(() => [...new Set(students.map((student) => student.track).filter(Boolean))].sort((a, b) => a.localeCompare(b, "ar")), [students]);
  const trackStudents = selectedTrack === "all" ? students : students.filter((student) => student.track === selectedTrack);
  const trackStats = calculateStats(trackStudents);
  const toppers = [...trackStudents].sort((a, b) => getAverage(b) - getAverage(a) || a.originalIndex - b.originalIndex).slice(0, 3);

  async function handleSubmit(event) {
    event.preventDefault();
    setError("");
    setMessage("");
    setMatches([]);
    setSelectedStudent(null);

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
      });

      if (!found.length) {
        setError("لم يتم العثور على نتيجة بهذا الرقم أو الاسم.");
        return;
      }

      if (found.length === 1) setSelectedStudent(found[0]);
      else setMatches(found);

      requestAnimationFrame(() => document.getElementById("resultArea")?.scrollIntoView({ behavior: "smooth", block: "nearest" }));
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

  function copyResultLink(student) {
    const url = `${window.location.origin}?q=${encodeURIComponent(student.id)}`;
    navigator.clipboard?.writeText(url);
    setMessage("تم نسخ رابط النتيجة.");
  }

  function selectStudent(student) {
    const known = students.find((item) => item.id === student.id);
    setMatches([]);
    setSelectedStudent(known || student);
    requestAnimationFrame(() => document.getElementById("resultArea")?.scrollIntoView({ behavior: "smooth", block: "nearest" }));
  }

  return (
    <main className="min-h-screen bg-mauri-bg pb-20 text-mauri-ink dark:bg-[#07130d] dark:text-white md:pb-0">
      <Header theme={theme} setTheme={setTheme} />

      <section id="home" className="app-shell grid gap-4 pt-4 md:gap-6 md:pt-6">
        <Hero />
        <SearchPanel error={error} handleSubmit={handleSubmit} loading={loading} message={message} query={query} setQuery={setQuery} />
        <section className="scroll-mt-20" id="resultArea">
          {loading && <ResultSkeleton />}
          {!loading && selectedStudent && <ResultCard student={selectedStudent} onCopyLink={copyResultLink} onShare={shareResult} />}
          {!loading && matches.length > 0 && <MatchesList matches={matches} onSelect={selectStudent} />}
        </section>
        <StatsStrip stats={stats} loading={dashboardLoading} />
      </section>

      <section id="toppers" className="app-shell grid gap-4 py-4 md:gap-6 md:py-8">
        <ToppersSection
          loading={dashboardLoading}
          onSelect={selectStudent}
          selectedTrack={selectedTrack}
          setSelectedTrack={setSelectedTrack}
          stats={trackStats}
          toppers={toppers}
          tracks={tracks}
        />
      </section>

      <section id="contact" className="app-shell grid gap-4 pb-6 md:pb-10">
        <ContactSection />
      </section>

      <Footer />
      <BottomNav />
    </main>
  );
}

function Header({ theme, setTheme }) {
  return (
    <header className="sticky top-0 z-40 border-b border-mauri-border/80 bg-white/95 backdrop-blur-xl dark:border-white/10 dark:bg-[#07130d]/95">
      <nav className="app-shell flex h-14 items-center justify-between gap-3">
        <a className="flex min-w-0 items-center gap-2.5" href="#home">
          <LogoMark className="h-9 w-9 rounded-[14px]" />
          <span className="min-w-0">
            <strong className="block truncate text-sm font-black tracking-tight">MauriResults</strong>
            <small className="block truncate text-[11px] font-bold text-slate-500 dark:text-slate-400">نتائج وطنية سريعة</small>
          </span>
        </a>
        <div className="hidden items-center gap-2 md:flex">
          <a className="nav-link" href="#home">الرئيسية</a>
          <a className="nav-link" href="#resultArea">البحث</a>
          <a className="nav-link" href="#toppers">الأوائل</a>
          <a className="nav-link" href="#contact">تواصل</a>
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
    <section className="compact-hero animate-slide-up">
      <div className="grid gap-2">
        <p className="text-xs font-black text-mauri-green dark:text-mauri-gold">منصة نتائج البكالوريا في موريتانيا</p>
        <h1 className="text-2xl font-black leading-tight tracking-tight text-slate-950 dark:text-white sm:text-4xl">ابحث عن نتيجتك بسرعة</h1>
        <p className="max-w-xl text-sm font-bold leading-6 text-slate-600 dark:text-slate-300">أدخل رقم المترشح أو الاسم الكامل، وستظهر النتيجة مباشرة تحت مربع البحث.</p>
      </div>
      <LogoMark className="hidden h-14 w-14 md:grid" />
    </section>
  );
}

function SearchPanel({ error, handleSubmit, loading, message, query, setQuery }) {
  return (
    <form onSubmit={handleSubmit} className="search-card animate-slide-up">
      <label className="relative block min-w-0 flex-1">
        <span className="pointer-events-none absolute inset-y-0 right-4 grid place-items-center text-mauri-green dark:text-mauri-gold" aria-hidden="true">
          <SearchIcon />
        </span>
        <input
          className="h-12 w-full rounded-[16px] border border-mauri-border bg-white px-4 pr-12 text-sm font-extrabold text-slate-950 outline-none transition placeholder:text-slate-400 focus:border-mauri-green/50 focus:ring-4 focus:ring-mauri-green/10 dark:border-white/10 dark:bg-white/10 dark:text-white"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="أدخل رقم المترشح أو الاسم الكامل"
        />
      </label>
      <button className="tap-button h-12 rounded-[16px] bg-mauri-green px-5 text-sm font-black text-white shadow-soft transition hover:bg-emerald-700 active:scale-[.98]" type="submit">
        {loading ? "بحث..." : "بحث"}
      </button>
      {(error || message) && (
        <p className={`col-span-full text-center text-xs font-black md:text-start ${error ? "text-red-600 dark:text-red-300" : "text-mauri-green dark:text-mauri-gold"}`}>{error || message}</p>
      )}
    </form>
  );
}

function StatsStrip({ stats, loading }) {
  const cards = [
    { label: "الطلاب", value: loading ? "" : stats.total.toLocaleString("ar-MR"), icon: <GraduationIcon /> },
    { label: "الناجحون", value: loading ? "" : stats.passed.toLocaleString("ar-MR"), icon: <CheckCircleIcon /> },
    { label: "الأعلى", value: loading ? "" : stats.highest.toFixed(2), icon: <TrendingIcon /> },
    { label: "المتوسط", value: loading ? "" : stats.average.toFixed(2), icon: <ChartIcon /> },
  ];

  return (
    <section className="grid gap-2">
      <SectionTitle eyebrow="لمحة سريعة" title="الإحصائيات" />
      <div className="-mx-4 flex snap-x gap-3 overflow-x-auto px-4 pb-2 md:mx-0 md:grid md:grid-cols-4 md:overflow-visible md:px-0">
        {cards.map((card) => (
          <MiniStatCard key={card.label} loading={loading} {...card} />
        ))}
      </div>
    </section>
  );
}

function MiniStatCard({ icon, label, loading, value }) {
  return (
    <article className="mini-card min-w-[9rem] snap-start">
      <span className="grid h-9 w-9 place-items-center rounded-[14px] bg-mauri-green/10 text-mauri-green dark:bg-emerald-300/10 dark:text-emerald-300">{icon}</span>
      <div className="min-w-0">
        {loading ? <span className="skeleton mt-1 block h-5 w-16" /> : <strong className="block text-lg font-black text-slate-950 dark:text-white">{value}</strong>}
        <span className="text-xs font-black text-slate-500 dark:text-slate-400">{label}</span>
      </div>
    </article>
  );
}

function ResultCard({ student, onCopyLink, onShare }) {
  const [detailsOpen, setDetailsOpen] = useState(false);
  const average = parseAverage(student.MOD);
  const status = getOfficialStatus(student.kr);
  const details = [
    ["رقم المترشح", student.id, <HashIcon key="hash" />],
    ["الشعبة", student.track, <BookIcon key="book" />],
    ["الرتبة", student.rank ? `#${student.rank}` : "غير متوفرة", <AwardIcon key="award" />],
    ["المؤسسة", student.ms || "غير متوفرة", <SchoolIcon key="school" />],
    ["الولاية", student.wl || "غير متوفرة", <MapIcon key="map" />],
  ];

  return (
    <article className="result-card animate-slide-up">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-xs font-black text-mauri-green dark:text-mauri-gold">النتيجة</p>
          <h2 className="mt-1 line-clamp-2 text-lg font-black leading-snug text-slate-950 dark:text-white">{student.name}</h2>
          <p className="mt-1 text-xs font-bold text-slate-500 dark:text-slate-400">{student.track}</p>
        </div>
        <div className="rounded-[18px] bg-mauri-green/10 px-3 py-2 text-center">
          <span className="block text-[11px] font-black text-slate-500 dark:text-slate-400">المعدل</span>
          <strong className="block text-2xl font-black text-mauri-green dark:text-mauri-gold">{average.toFixed(2)}</strong>
        </div>
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-2">
        <StatusBadge status={status} />
        <span className="rounded-full bg-slate-100 px-3 py-2 text-xs font-black text-slate-600 dark:bg-white/10 dark:text-slate-300">{getAverageMessage(average)}</span>
      </div>

      {detailsOpen && (
        <div className="mt-3 grid gap-2 sm:grid-cols-2">
          {details.map(([label, value, icon]) => (
            <InfoTile icon={icon} label={label} value={value} key={label} />
          ))}
        </div>
      )}

      <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-5">
        <ActionButton icon={<InfoIcon />} label={detailsOpen ? "إخفاء" : "التفاصيل"} onClick={() => setDetailsOpen((value) => !value)} variant="light" />
        <ActionButton icon={<ShareIcon />} label="مشاركة" onClick={() => onShare(student)} />
        <ActionButton icon={<DownloadIcon />} label="PDF" onClick={() => window.print()} variant="light" />
        <ActionButton icon={<PrinterIcon />} label="طباعة" onClick={() => window.print()} variant="light" />
        <ActionButton icon={<LinkIcon />} label="نسخ الرابط" onClick={() => onCopyLink(student)} variant="light" />
      </div>
    </article>
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

function ResultSkeleton() {
  return (
    <div className="result-card animate-slide-up">
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

function ToppersSection({ tracks, selectedTrack, setSelectedTrack, stats, toppers, loading, onSelect }) {
  return (
    <section className="grid gap-3">
      <div className="flex items-end justify-between gap-3">
        <SectionTitle eyebrow="الأوائل" title="أوائل الشعب" />
        <TrackSelect selectedTrack={selectedTrack} setSelectedTrack={setSelectedTrack} tracks={tracks} />
      </div>
      <div className="grid grid-cols-3 gap-2">
        <MiniMetric label="الطلاب" value={loading ? "..." : stats.total.toLocaleString("ar-MR")} />
        <MiniMetric label="الناجحون" value={loading ? "..." : stats.passed.toLocaleString("ar-MR")} />
        <MiniMetric label="الأعلى" value={loading ? "..." : stats.highest.toFixed(2)} />
      </div>
      <div className="grid gap-2">
        {loading ? (
          <>
            <TopperSkeleton />
            <TopperSkeleton />
            <TopperSkeleton />
          </>
        ) : toppers.length ? (
          toppers.map((student, index) => <TopperCard student={student} index={index} onSelect={onSelect} key={student.id} />)
        ) : (
          <p className="rounded-[18px] border border-mauri-border bg-white p-4 text-sm font-bold text-slate-500 dark:border-white/10 dark:bg-white/10 dark:text-slate-400">لا توجد بيانات كافية لهذه الشعبة.</p>
        )}
      </div>
    </section>
  );
}

function TrackSelect({ tracks, selectedTrack, setSelectedTrack }) {
  return (
    <label className="relative block w-40 shrink-0">
      <span className="sr-only">اختيار الشعبة</span>
      <select className="h-10 w-full appearance-none rounded-[14px] border border-mauri-border bg-white px-3 pl-9 text-xs font-black text-slate-950 outline-none shadow-soft focus:border-mauri-green focus:ring-4 focus:ring-mauri-green/10 dark:border-white/10 dark:bg-white/10 dark:text-white" value={selectedTrack} onChange={(event) => setSelectedTrack(event.target.value)}>
        <option value="all">كل الشعب</option>
        {tracks.map((track) => <option value={track} key={track}>{track}</option>)}
      </select>
      <span className="pointer-events-none absolute bottom-0 left-3 grid h-10 place-items-center text-slate-400">
        <ChevronDownIcon />
      </span>
    </label>
  );
}

function MiniMetric({ label, value }) {
  return (
    <div className="rounded-[16px] border border-mauri-border bg-white p-3 text-center shadow-soft dark:border-white/10 dark:bg-white/10">
      <strong className="block text-sm font-black text-slate-950 dark:text-white">{value}</strong>
      <span className="text-[11px] font-black text-slate-500 dark:text-slate-400">{label}</span>
    </div>
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
        <button className="text-[11px] font-black text-slate-500 underline-offset-4 hover:text-mauri-green hover:underline" onClick={() => onSelect(student)} type="button">عرض</button>
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

function ContactSection() {
  const links = [
    { label: "واتساب", href: "https://wa.me/22244881891", icon: <WhatsAppIcon /> },
    { label: "فيسبوك", href: "https://www.facebook.com/ahmed.abde.mady", icon: <FacebookIcon /> },
    { label: "تيليغرام", href: "https://t.me/mauriresults", icon: <TelegramIcon /> },
  ];

  return (
    <section className="grid gap-3">
      <SectionTitle eyebrow="تواصل" title="قنوات سريعة" />
      <div className="grid grid-cols-3 gap-2">
        {links.map((link) => (
          <a className="contact-chip" href={link.href} key={link.label} target="_blank" rel="noopener">
            {link.icon}
            <span>{link.label}</span>
          </a>
        ))}
      </div>
    </section>
  );
}

function Footer() {
  return (
    <footer className="border-t border-mauri-border bg-white py-5 dark:border-white/10 dark:bg-white/5">
      <div className="app-shell grid gap-3 text-center md:text-start">
        <div className="flex items-center justify-center gap-3 md:justify-start">
          <LogoMark className="h-10 w-10 rounded-[14px]" />
          <div>
            <strong className="block text-base font-black text-slate-950 dark:text-white">MauriResults</strong>
            <span className="text-xs font-bold text-slate-500 dark:text-slate-400">منصة موريتانية سريعة لعرض النتائج.</span>
          </div>
        </div>
        <p className="text-xs font-bold text-slate-500 dark:text-slate-400">مبرمج الموقع: Ahmed abdellahi mady - جميع الحقوق محفوظة © MauriResults.</p>
      </div>
    </footer>
  );
}

function BottomNav() {
  const items = [
    { label: "الرئيسية", href: "#home", icon: <HomeIcon /> },
    { label: "البحث", href: "#resultArea", icon: <SearchIcon /> },
    { label: "الأوائل", href: "#toppers", icon: <AwardIcon /> },
    { label: "تواصل", href: "#contact", icon: <MessageIcon /> },
  ];

  return (
    <nav className="fixed inset-x-0 bottom-0 z-50 border-t border-mauri-border bg-white/95 px-3 pb-[max(.5rem,env(safe-area-inset-bottom))] pt-2 shadow-[0_-10px_30px_rgba(15,23,42,.08)] backdrop-blur-xl dark:border-white/10 dark:bg-[#07130d]/95 md:hidden">
      <div className="mx-auto grid max-w-md grid-cols-4 gap-1">
        {items.map((item) => (
          <a className="grid justify-items-center gap-1 rounded-[14px] px-2 py-1.5 text-[11px] font-black text-slate-500 transition active:scale-95 hover:bg-mauri-green/10 hover:text-mauri-green dark:text-slate-300" href={item.href} key={item.label}>
            {item.icon}
            <span>{item.label}</span>
          </a>
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
  const className = variant === "solid" ? "action-button bg-mauri-green text-white hover:bg-emerald-700" : "action-button border border-mauri-border bg-white text-slate-700 hover:border-mauri-green/40 hover:text-mauri-green dark:border-white/10 dark:bg-white/10 dark:text-slate-100";
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
function ChevronDownIcon() { return <svg viewBox="0 0 24 24"><path d="m6 9 6 6 6-6" /></svg>; }
function TelegramIcon() { return <svg viewBox="0 0 24 24"><path d="M21 4 3 11l7 2 2 7 9-16Z" /><path d="m10 13 4 4" /></svg>; }
function LinkIcon() { return <svg viewBox="0 0 24 24"><path d="M10 13a5 5 0 0 0 7.1 0l2-2a5 5 0 0 0-7.1-7.1l-1.1 1.1" /><path d="M14 11a5 5 0 0 0-7.1 0l-2 2A5 5 0 0 0 12 20.1l1.1-1.1" /></svg>; }
function HomeIcon() { return <svg viewBox="0 0 24 24"><path d="m3 11 9-8 9 8" /><path d="M5 10v10h14V10" /><path d="M10 20v-6h4v6" /></svg>; }
function GoldMedalIcon() { return <svg viewBox="0 0 24 24"><circle cx="12" cy="13" r="5" /><path d="m8 2 4 6 4-6" /><path d="M12 11v4" /><path d="M10 13h4" /></svg>; }
function SilverMedalIcon() { return <svg viewBox="0 0 24 24"><circle cx="12" cy="13" r="5" /><path d="m8 2 4 6 4-6" /><path d="M10 12a2 2 0 0 1 4 0c0 2-4 2-4 4h4" /></svg>; }
function BronzeMedalIcon() { return <svg viewBox="0 0 24 24"><circle cx="12" cy="13" r="5" /><path d="m8 2 4 6 4-6" /><path d="M10 11h4l-2 2a2 2 0 1 1-2 2" /></svg>; }
