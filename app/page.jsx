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

      requestAnimationFrame(() => document.getElementById("resultArea")?.scrollIntoView({ behavior: "smooth", block: "start" }));
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
    const known = students.find((item) => item.id === student.id);
    setMatches([]);
    setSelectedStudent(known || student);
    requestAnimationFrame(() => document.getElementById("resultArea")?.scrollIntoView({ behavior: "smooth", block: "start" }));
  }

  return (
    <main className="min-h-screen overflow-hidden bg-mauri-bg text-mauri-ink dark:bg-[#07130d] dark:text-white">
      <Header theme={theme} setTheme={setTheme} />

      <Hero
        error={error}
        handleSubmit={handleSubmit}
        loading={loading}
        message={message}
        query={query}
        setQuery={setQuery}
      />

      <section id="dashboard" className="mx-auto grid w-[min(1180px,calc(100%-1.25rem))] gap-6 py-8 md:w-[min(1180px,calc(100%-2.5rem))] md:py-12">
        <StatsSection stats={stats} loading={dashboardLoading} />
        {(selectedStudent || matches.length > 0) && (
          <section className="scroll-mt-24" id="resultArea">
            {selectedStudent ? <ResultCard student={selectedStudent} onShare={shareResult} /> : <MatchesList matches={matches} onSelect={selectStudent} />}
          </section>
        )}
        <ToppersSection
          loading={dashboardLoading}
          onSelect={selectStudent}
          selectedTrack={selectedTrack}
          setSelectedTrack={setSelectedTrack}
          stats={trackStats}
          toppers={toppers}
          tracks={tracks}
        />
        <WhatsAppBanner />
        <ContactSection />
        <DeveloperCard />
      </section>

      <Footer />
      {loading && <Loader />}
    </main>
  );
}

function Header({ theme, setTheme }) {
  return (
    <header className="fixed inset-x-0 top-0 z-40 border-b border-mauri-border/80 bg-white/80 backdrop-blur-2xl dark:border-white/10 dark:bg-[#07130d]/82">
      <nav className="mx-auto flex h-16 w-[min(1180px,calc(100%-1.25rem))] items-center justify-between gap-3 md:w-[min(1180px,calc(100%-2.5rem))]">
        <a className="group flex min-w-0 items-center gap-3" href="#">
          <LogoMark className="h-11 w-11" />
          <span className="min-w-0">
            <strong className="block truncate text-base font-black tracking-tight">MauriResults</strong>
            <small className="block text-xs font-bold text-slate-500 dark:text-slate-400">منصة نتائج وطنية</small>
          </span>
        </a>
        <div className="flex items-center gap-2">
          <a className="premium-button hidden h-10 items-center gap-2 px-4 text-sm sm:inline-flex" href="#contact">
            <MessageIcon />
            تواصل
          </a>
          <button className="icon-button" onClick={() => setTheme(theme === "dark" ? "light" : "dark")} type="button" aria-label="تبديل الوضع الليلي">
            {theme === "dark" ? <MoonIcon /> : <SunIcon />}
          </button>
        </div>
      </nav>
    </header>
  );
}

function Hero({ error, handleSubmit, loading, message, query, setQuery }) {
  return (
    <section className="relative isolate flex min-h-[100svh] items-center px-3 pt-16">
      <div className="hero-surface" />
      <div className="mx-auto grid w-[min(960px,100%)] justify-items-center gap-5 py-10 text-center">
        <LogoMark className="h-20 w-20 animate-scale-in" />
        <div className="animate-slide-up rounded-full border border-mauri-gold/35 bg-white/80 px-4 py-2 text-sm font-black text-mauri-green shadow-soft backdrop-blur-xl dark:border-mauri-gold/30 dark:bg-white/10 dark:text-mauri-gold">
          منصة نتائج البكالوريا في موريتانيا
        </div>
        <h1 className="animate-slide-up text-balance text-5xl font-black leading-[1.08] tracking-tight text-slate-950 dark:text-white sm:text-6xl lg:text-7xl">
          نتائج البكالوريا
          <span className="block text-mauri-green dark:text-emerald-300">في موريتانيا</span>
        </h1>
        <p className="animate-slide-up max-w-xl text-lg font-bold text-slate-600 dark:text-slate-300 sm:text-xl">
          ابحث عن نتيجتك خلال ثوان.
        </p>
        <SearchPanel error={error} handleSubmit={handleSubmit} loading={loading} message={message} query={query} setQuery={setQuery} />
      </div>
    </section>
  );
}

function SearchPanel({ error, handleSubmit, loading, message, query, setQuery }) {
  return (
    <form onSubmit={handleSubmit} className="animate-slide-up w-full max-w-3xl rounded-[20px] border border-mauri-border bg-white p-2 shadow-premium dark:border-white/10 dark:bg-white/10">
      <div className="grid gap-2 sm:grid-cols-[1fr_auto]">
        <label className="relative block">
          <span className="pointer-events-none absolute inset-y-0 right-5 grid place-items-center text-mauri-green dark:text-mauri-gold" aria-hidden="true">
            <SearchIcon />
          </span>
          <input
            className="h-[60px] w-full rounded-[16px] border border-transparent bg-[#F8FAF8] pr-14 text-base font-extrabold text-slate-950 outline-none transition placeholder:text-slate-400 focus:border-mauri-green/35 focus:bg-white focus:ring-4 focus:ring-mauri-green/10 dark:bg-white/10 dark:text-white dark:placeholder:text-slate-400"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="أدخل رقم المترشح أو الاسم الكامل"
          />
        </label>
        <button className="ripple-button h-[60px] rounded-[16px] bg-mauri-green px-8 text-base font-black text-white shadow-[0_12px_28px_rgba(21,128,61,.18)] transition hover:-translate-y-0.5 hover:bg-emerald-700 focus:outline-none focus:ring-4 focus:ring-mauri-green/20" type="submit">
          {loading ? "جاري البحث..." : "بحث"}
        </button>
      </div>
      <div className="flex min-h-8 flex-col items-center justify-between gap-1 px-2 pt-2 text-sm font-bold sm:flex-row">
        <p className="text-slate-500 dark:text-slate-400">يدعم البحث برقم المترشح أو الاسم الكامل.</p>
        <p className={error ? "text-red-600 dark:text-red-300" : "text-mauri-green dark:text-mauri-gold"}>{error || message}</p>
      </div>
    </form>
  );
}

function StatsSection({ stats, loading }) {
  const cards = [
    { label: "عدد الطلاب", value: loading ? "..." : stats.total.toLocaleString("ar-MR"), icon: <GraduationIcon /> },
    { label: "عدد الناجحين", value: loading ? "..." : stats.passed.toLocaleString("ar-MR"), icon: <CheckCircleIcon /> },
    { label: "أعلى معدل", value: loading ? "..." : stats.highest.toFixed(2), icon: <TrendingIcon /> },
    { label: "متوسط المعدلات", value: loading ? "..." : stats.average.toFixed(2), icon: <ChartIcon /> },
  ];

  return (
    <section className="content-section">
      <SectionHeader eyebrow="مؤشرات مباشرة" title="الإحصائيات العامة" description="لمحة سريعة عن بيانات النتائج المتاحة على المنصة." />
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {cards.map((card, index) => (
          <StatCard index={index} key={card.label} {...card} />
        ))}
      </div>
    </section>
  );
}

function StatCard({ icon, index, label, value }) {
  return (
    <article className="premium-card animate-card-in grid min-h-44 place-items-center gap-3 p-5 text-center" style={{ animationDelay: `${index * 80}ms` }}>
      <span className="grid h-12 w-12 place-items-center rounded-2xl bg-mauri-green/10 text-mauri-green dark:bg-emerald-300/10 dark:text-emerald-300">{icon}</span>
      <strong className="text-3xl font-black tracking-tight text-slate-950 dark:text-white">{value}</strong>
      <span className="text-sm font-extrabold text-slate-500 dark:text-slate-400">{label}</span>
    </article>
  );
}

function ResultCard({ student, onShare }) {
  const average = parseAverage(student.MOD);
  const status = getOfficialStatus(student.kr);
  const items = [
    ["الاسم", student.name, <UserIcon key="user" />],
    ["رقم المترشح", student.id, <HashIcon key="hash" />],
    ["الشعبة", student.track, <BookIcon key="book" />],
    ["المعدل", average.toFixed(2), <ChartIcon key="chart" />],
    ["النتيجة", <StatusBadge key="status" status={status} />, <CheckCircleIcon key="check" />],
    ["الرتبة", student.rank ? `#${student.rank}` : "غير متوفرة", <AwardIcon key="award" />],
    ["المؤسسة", student.ms || "غير متوفرة", <SchoolIcon key="school" />],
    ["الولاية", student.wl || "غير متوفرة", <MapIcon key="map" />],
  ];

  return (
    <article className="premium-card animate-rise overflow-hidden">
      <div className="grid gap-5 border-b border-mauri-border bg-white p-5 dark:border-white/10 dark:bg-white/5 md:grid-cols-[1fr_auto] md:items-center md:p-7">
        <div>
          <p className="text-sm font-black text-mauri-green dark:text-mauri-gold">بطاقة النتيجة</p>
          <h2 className="mt-2 text-balance text-3xl font-black leading-tight text-slate-950 dark:text-white md:text-4xl">{student.name}</h2>
          <p className="mt-2 font-bold text-slate-500 dark:text-slate-400">{getAverageMessage(average)}</p>
        </div>
        <div className="rounded-[20px] border border-mauri-gold/35 bg-mauri-gold/10 p-5 text-center">
          <span className="text-sm font-black text-slate-500 dark:text-slate-400">المعدل العام</span>
          <strong className="mt-1 block text-5xl font-black text-mauri-green dark:text-mauri-gold">{average.toFixed(2)}</strong>
        </div>
      </div>
      <div className="grid gap-4 p-4 md:p-6">
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {items.map(([label, value, icon]) => (
            <InfoTile icon={icon} label={label} value={value} key={label} />
          ))}
        </div>
        <div className="grid gap-3 sm:grid-cols-3">
          <ActionButton icon={<DownloadIcon />} label="تحميل PDF" onClick={() => window.print()} />
          <ActionButton icon={<PrinterIcon />} label="طباعة" onClick={() => window.print()} variant="light" />
          <ActionButton icon={<ShareIcon />} label="مشاركة" onClick={() => onShare(student)} />
        </div>
      </div>
    </article>
  );
}

function InfoTile({ icon, label, value }) {
  return (
    <div className="soft-tile grid min-h-28 grid-cols-[auto_1fr] items-center gap-3 p-4">
      <span className="grid h-10 w-10 place-items-center rounded-2xl bg-mauri-green/10 text-mauri-green dark:bg-emerald-300/10 dark:text-emerald-300">{icon}</span>
      <div className="min-w-0">
        <span className="text-sm font-extrabold text-slate-500 dark:text-slate-400">{label}</span>
        <strong className="mt-1 block overflow-wrap-anywhere font-black text-slate-950 dark:text-white">{value}</strong>
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
    <section className="premium-card animate-rise overflow-hidden">
      <div className="border-b border-mauri-border p-5 dark:border-white/10">
        <SectionHeader eyebrow="نتائج البحث" title="اختر المترشح المطلوب" description="ظهرت عدة نتائج مطابقة لعملية البحث." />
      </div>
      <div className="grid gap-3 p-4">
        {matches.map((student) => (
          <button className="soft-tile p-4 text-start transition hover:-translate-y-0.5 hover:border-mauri-green/35 hover:shadow-soft" key={student.id} onClick={() => onSelect(student)} type="button">
            <strong className="block font-black text-slate-950 dark:text-white">{student.name}</strong>
            <span className="mt-1 block text-sm font-bold text-slate-500 dark:text-slate-400">رقم {student.id} - {student.track} - معدل {parseAverage(student.MOD).toFixed(2)}</span>
          </button>
        ))}
      </div>
    </section>
  );
}

function ToppersSection({ tracks, selectedTrack, setSelectedTrack, stats, toppers, loading, onSelect }) {
  return (
    <section className="content-section">
      <div className="grid gap-4 lg:grid-cols-[1fr_20rem] lg:items-end">
        <SectionHeader eyebrow="لوحة المتفوقين" title="أوائل الشعب" description="أفضل ثلاث نتائج حسب الشعبة المختارة." />
        <TrackSelect selectedTrack={selectedTrack} setSelectedTrack={setSelectedTrack} tracks={tracks} />
      </div>
      <div className="grid gap-3 sm:grid-cols-3">
        <MiniMetric label="الطلاب" value={loading ? "..." : stats.total.toLocaleString("ar-MR")} />
        <MiniMetric label="الناجحون" value={loading ? "..." : stats.passed.toLocaleString("ar-MR")} />
        <MiniMetric label="الأعلى" value={loading ? "..." : stats.highest.toFixed(2)} />
      </div>
      <div className="grid gap-4 lg:grid-cols-3">
        {loading ? (
          <p className="font-bold text-slate-500 dark:text-slate-400">جاري تحميل أوائل الشعب...</p>
        ) : toppers.length ? (
          toppers.map((student, index) => <TopperCard student={student} index={index} onSelect={onSelect} key={student.id} />)
        ) : (
          <p className="font-bold text-slate-500 dark:text-slate-400">لا توجد بيانات كافية لهذه الشعبة.</p>
        )}
      </div>
    </section>
  );
}

function TrackSelect({ tracks, selectedTrack, setSelectedTrack }) {
  return (
    <label className="relative block">
      <span className="mb-2 block text-sm font-black text-slate-500 dark:text-slate-400">اختيار الشعبة</span>
      <span className="pointer-events-none absolute bottom-0 right-4 grid h-12 place-items-center text-mauri-green dark:text-mauri-gold">
        <BookIcon />
      </span>
      <select className="h-12 w-full appearance-none rounded-[16px] border border-mauri-border bg-white px-12 font-black text-slate-950 outline-none shadow-soft transition focus:border-mauri-green focus:ring-4 focus:ring-mauri-green/10 dark:border-white/10 dark:bg-white/10 dark:text-white" id="trackSelect" value={selectedTrack} onChange={(event) => setSelectedTrack(event.target.value)}>
        <option value="all">كل الشعب</option>
        {tracks.map((track) => <option value={track} key={track}>{track}</option>)}
      </select>
      <span className="pointer-events-none absolute bottom-0 left-4 grid h-12 place-items-center text-slate-400">
        <ChevronDownIcon />
      </span>
    </label>
  );
}

function MiniMetric({ label, value }) {
  return (
    <div className="soft-tile min-h-20 p-4 text-center">
      <span className="text-xs font-black text-slate-500 dark:text-slate-400">{label}</span>
      <strong className="mt-1 block text-xl font-black text-slate-950 dark:text-white">{value}</strong>
    </div>
  );
}

function TopperCard({ student, index, onSelect }) {
  const medals = [
    { name: "المركز الأول", className: "from-[#fff7d6] to-white border-[#D4AF37]/45 text-[#9a6b00]", icon: <GoldMedalIcon /> },
    { name: "المركز الثاني", className: "from-[#f4f6f8] to-white border-slate-300 text-slate-600", icon: <SilverMedalIcon /> },
    { name: "المركز الثالث", className: "from-[#fff0e5] to-white border-[#CD7F32]/35 text-[#9a4f18]", icon: <BronzeMedalIcon /> },
  ];
  const medal = medals[index] || medals[0];

  return (
    <article className={`topper-card bg-gradient-to-br ${medal.className}`}>
      <div className="flex items-center justify-between gap-3">
        <span className="grid h-12 w-12 place-items-center rounded-2xl bg-white/80 shadow-soft">{medal.icon}</span>
        <span className="rounded-full bg-white/70 px-3 py-1 text-xs font-black">{medal.name}</span>
      </div>
      <div>
        <span className="text-sm font-black text-slate-500">رقم الترتيب</span>
        <strong className="mt-1 block text-4xl font-black">#{index + 1}</strong>
      </div>
      <div>
        <h3 className="text-balance text-xl font-black text-slate-950">{student.name}</h3>
        <p className="mt-2 text-sm font-bold text-slate-600">{student.track}</p>
      </div>
      <div className="flex items-center justify-between gap-3">
        <div>
          <span className="text-xs font-black text-slate-500">المعدل</span>
          <strong className="block text-2xl font-black text-mauri-green">{parseAverage(student.MOD).toFixed(2)}</strong>
        </div>
        <button className="ripple-button rounded-[14px] bg-mauri-green px-4 py-3 text-sm font-black text-white shadow-[0_12px_24px_rgba(21,128,61,.18)] transition hover:-translate-y-0.5 hover:bg-emerald-700" onClick={() => onSelect(student)} type="button">
          عرض النتيجة
        </button>
      </div>
    </article>
  );
}

function WhatsAppBanner() {
  return (
    <section className="overflow-hidden rounded-[20px] border border-mauri-green/15 bg-emerald-50 p-5 shadow-soft dark:border-emerald-300/10 dark:bg-emerald-300/10 md:p-6">
      <div className="grid gap-4 md:grid-cols-[1fr_auto] md:items-center">
        <div className="flex items-start gap-4">
          <span className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-white text-mauri-green shadow-soft dark:bg-white/10 dark:text-emerald-300">
            <WhatsAppIcon />
          </span>
          <div>
            <h2 className="text-2xl font-black text-slate-950 dark:text-white">مجتمع MauriResults</h2>
            <p className="mt-2 max-w-2xl font-bold leading-7 text-slate-600 dark:text-slate-300">
              انضم إلى مجتمع MauriResults على واتساب للحصول على آخر التحديثات وروابط النتائج.
            </p>
          </div>
        </div>
        <a className="ripple-button inline-flex min-h-12 items-center justify-center rounded-[16px] bg-mauri-green px-6 font-black text-white shadow-[0_14px_28px_rgba(21,128,61,.18)] transition hover:-translate-y-0.5 hover:bg-emerald-700" href="https://wa.me/22200000000" target="_blank" rel="noopener">
          انضم الآن
        </a>
      </div>
    </section>
  );
}

function ContactSection() {
  const links = [
    { label: "Facebook", value: "تابع الصفحة", href: "https://www.facebook.com/ahmed.abde.mady", icon: <FacebookIcon /> },
    { label: "WhatsApp", value: "+222 44 88 18 91", href: "https://wa.me/22244881891", icon: <WhatsAppIcon /> },
    { label: "Email", value: "contact@mauriresults.mr", href: "mailto:contact@mauriresults.mr", icon: <MailIcon /> },
    { label: "Telegram", value: "قناة التحديثات", href: "https://t.me/mauriresults", icon: <TelegramIcon /> },
  ];

  return (
    <section className="content-section" id="contact">
      <SectionHeader eyebrow="تواصل معنا" title="قنوات التواصل" description="روابط سريعة للاستفسارات والتحديثات الرسمية." />
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {links.map((link) => (
          <a className="premium-card group grid min-h-40 gap-3 p-5 transition hover:-translate-y-1 hover:border-mauri-green/30 hover:shadow-premium" href={link.href} key={link.label} target="_blank" rel="noopener">
            <span className="grid h-11 w-11 place-items-center rounded-2xl bg-mauri-green/10 text-mauri-green transition group-hover:scale-105 dark:bg-emerald-300/10 dark:text-emerald-300">{link.icon}</span>
            <strong className="text-xl font-black text-slate-950 dark:text-white">{link.label}</strong>
            <span className="text-sm font-bold text-slate-500 dark:text-slate-400">{link.value}</span>
          </a>
        ))}
      </div>
    </section>
  );
}

function DeveloperCard() {
  return (
    <section className="premium-card overflow-hidden">
      <div className="grid gap-4 p-5 md:grid-cols-[1fr_auto] md:items-center md:p-6">
        <div className="flex min-w-0 items-center gap-4">
          <span className="grid h-14 w-14 shrink-0 place-items-center rounded-[20px] bg-mauri-green text-white shadow-soft">
            <UserIcon />
          </span>
          <div className="min-w-0">
            <p className="text-sm font-extrabold text-mauri-green dark:text-mauri-gold">مبرمج الموقع</p>
            <h2 className="mt-1 overflow-wrap-anywhere text-2xl font-black tracking-tight text-slate-950 dark:text-white">Ahmed abdellahi mady</h2>
          </div>
        </div>
        <div className="grid gap-3 sm:grid-cols-2 md:min-w-[22rem]">
          <a className="soft-tile flex min-h-14 items-center justify-center gap-2 px-4 text-center font-black transition hover:-translate-y-0.5 hover:shadow-soft" href="https://www.facebook.com/ahmed.abde.mady" target="_blank" rel="noopener">
            <FacebookIcon />
            حسابي فيسبوك
          </a>
          <a className="ripple-button flex min-h-14 items-center justify-center gap-2 rounded-[16px] bg-mauri-green px-4 text-center font-black text-white shadow-soft transition hover:-translate-y-0.5 hover:bg-emerald-700" href="https://wa.me/22244881891" target="_blank" rel="noopener">
            <WhatsAppIcon />
            واتسابي
          </a>
        </div>
      </div>
    </section>
  );
}

function Footer() {
  const links = ["الرئيسية", "سياسة الخصوصية", "تواصل معنا", "حول الموقع"];

  return (
    <footer className="border-t border-mauri-border bg-white/80 py-8 dark:border-white/10 dark:bg-white/5">
      <div className="mx-auto grid w-[min(1180px,calc(100%-1.25rem))] gap-6 md:w-[min(1180px,calc(100%-2.5rem))] lg:grid-cols-[1fr_auto] lg:items-center">
        <div className="flex items-center gap-4">
          <LogoMark className="h-12 w-12" />
          <div>
            <strong className="text-xl font-black text-slate-950 dark:text-white">MauriResults</strong>
            <p className="mt-1 max-w-xl text-sm font-bold leading-6 text-slate-500 dark:text-slate-400">منصة موريتانية حديثة وسريعة لعرض نتائج البكالوريا والبريفية والكونكور.</p>
          </div>
        </div>
        <nav className="flex flex-wrap gap-3 text-sm font-black text-slate-600 dark:text-slate-300">
          {links.map((link) => (
            <a className="rounded-full px-3 py-2 transition hover:bg-mauri-green/10 hover:text-mauri-green" href={link === "الرئيسية" ? "#" : "#contact"} key={link}>{link}</a>
          ))}
        </nav>
        <p className="text-sm font-bold text-slate-500 dark:text-slate-400 lg:col-span-2">جميع الحقوق محفوظة © MauriResults.</p>
      </div>
    </footer>
  );
}

function Loader() {
  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-slate-950/45 backdrop-blur-xl">
      <div className="premium-card w-[min(20rem,calc(100%-2rem))] p-6 text-center font-black">
        <span className="mx-auto mb-3 block h-11 w-11 animate-spin rounded-full border-4 border-slate-200 border-t-mauri-green dark:border-white/20 dark:border-t-mauri-gold" />
        جاري عرض النتائج...
      </div>
    </div>
  );
}

function SectionHeader({ description, eyebrow, title }) {
  return (
    <div>
      <p className="text-sm font-black text-mauri-green dark:text-mauri-gold">{eyebrow}</p>
      <h2 className="mt-1 text-3xl font-black tracking-tight text-slate-950 dark:text-white">{title}</h2>
      {description && <p className="mt-2 max-w-2xl font-bold leading-7 text-slate-500 dark:text-slate-400">{description}</p>}
    </div>
  );
}

function ActionButton({ icon, label, onClick, variant = "solid" }) {
  const className = variant === "solid"
    ? "ripple-button min-h-14 rounded-[16px] bg-mauri-green px-4 font-black text-white shadow-soft transition hover:-translate-y-0.5 hover:bg-emerald-700"
    : "ripple-button soft-tile min-h-14 px-4 font-black transition hover:-translate-y-0.5 hover:shadow-soft";

  return (
    <button className={`${className} flex items-center justify-center gap-2`} onClick={onClick} type="button">
      {icon}
      {label}
    </button>
  );
}

function LogoMark({ className = "h-12 w-12" }) {
  return (
    <span className={`${className} grid shrink-0 place-items-center rounded-[20px] border border-mauri-green/10 bg-white text-sm font-black text-mauri-green shadow-soft dark:border-white/10 dark:bg-white/10 dark:text-emerald-300`}>
      MR
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
function MailIcon() { return <svg viewBox="0 0 24 24"><path d="M4 6h16v12H4Z" /><path d="m4 7 8 6 8-6" /></svg>; }
function TelegramIcon() { return <svg viewBox="0 0 24 24"><path d="M21 4 3 11l7 2 2 7 9-16Z" /><path d="m10 13 4 4" /></svg>; }
function GoldMedalIcon() { return <svg viewBox="0 0 24 24"><circle cx="12" cy="13" r="5" /><path d="m8 2 4 6 4-6" /><path d="M12 11v4" /><path d="M10 13h4" /></svg>; }
function SilverMedalIcon() { return <svg viewBox="0 0 24 24"><circle cx="12" cy="13" r="5" /><path d="m8 2 4 6 4-6" /><path d="M10 12a2 2 0 0 1 4 0c0 2-4 2-4 4h4" /></svg>; }
function BronzeMedalIcon() { return <svg viewBox="0 0 24 24"><circle cx="12" cy="13" r="5" /><path d="m8 2 4 6 4-6" /><path d="M10 11h4l-2 2a2 2 0 1 1-2 2" /></svg>; }
