from pathlib import Path
import re

p = Path("components/home/HomeApplication.jsx")
s = p.read_text(encoding="utf-8").replace("\r\n", "\n")


def replace_exact(old, new, label, count=1):
    global s
    if s.count(old) < count:
        raise SystemExit(f"missing {label}")
    s = s.replace(old, new, count)


def replace_re(pattern, repl, label, count=1, flags=0):
    global s
    s2, n = re.subn(pattern, lambda _m: repl, s, count=count, flags=flags)
    if n < count:
        raise SystemExit(f"missing regex {label}")
    s = s2


replace_exact('''function getAverage(student) {
  return parseAverage(student.MOD);
}

function formatScore(student, text = UI_TEXT.ar) {
  const score = getAverage(student);
  return student.source === "concours" ? `${score.toFixed(2)} / 200` : score.toFixed(2);
}''', '''function getAverage(student) {
  return parseAverage(student.MOD);
}

function isConcoursStudent(student) {
  return student?.source === "concours" || student?.searchMode === "concours";
}

function formatScore(student, text = UI_TEXT.ar) {
  const score = getAverage(student);
  return isConcoursStudent(student) ? `${score.toFixed(2)} / 200` : score.toFixed(2);
}''', "concours helper")

replace_re(r'''function getResultShareText\(student, text = UI_TEXT\.ar\) \{\n.*?\n\}''', '''function getResultShareText(student, text = UI_TEXT.ar) {
  const scoreLabel = isConcoursStudent(student) ? text.totalScore : text.averageLabel;
  const trackLine = cleanText(student.track) ? `\\n${text.track}: ${student.track}` : "";
  const rankLine = Number(student.rank) > 0 ? `\\n${text.rank}: ${student.rank}` : "";
  return `${text.result} ${student.name}\\n${text.id}: ${student.id}${trackLine}\\n${scoreLabel}: ${formatScore(student, text)}${rankLine}\\nMauriResults`;
}''', "share function", flags=re.S)

replace_re(r'''function normalizeTopStudent\(row, source, index = 0\) \{\n.*?\n\}''', '''function normalizeTopStudent(row, source, index = 0) {
  const id = String(row.numero ?? row.id ?? row.NODOSS ?? row.Numero ?? "").trim();
  const score = numberValue(row.average_score ?? row.total_score ?? row.MOD ?? row.Mgex ?? row["Moy Bac_Session"] ?? row.Moyenne_Bepc);
  const uploaded = String(source || "").startsWith("upload:");
  const searchMode = cleanText(row.searchMode ?? row.search_mode ?? (row.isConcours ? "concours" : ""));
  const student = {
    id,
    name: cleanText(row.name ?? row.NOM ?? row.NOM_AR ?? row.Nom ?? "اسم غير متوفر"),
    track: cleanText(row.track ?? row.serie ?? row.SERIE ?? row.TYPE ?? (uploaded ? "" : source === "concours" ? "كونكور" : "غير محددة")),
    MOD: score,
    kr: cleanText(row.kr ?? row.decision ?? row.Decision ?? ""),
    wl: cleanText(row.wl ?? row.wilaya ?? row.WILAYA ?? row.Wilaya_AR ?? row.WL ?? ""),
    moughataa: cleanText(row.moughataa ?? row.MOUGHATAA_AR ?? row.MD ?? ""),
    ms: cleanText(row.ms ?? row.school ?? row.Ecole ?? row.Ecole_AR ?? row.Etablissement_AR ?? row.MS ?? ""),
    centre: cleanText(row.centre ?? row.center ?? row.Centre ?? row.CENTRE_AR ?? row["Centre Examen_AR"] ?? ""),
    birthPlace: cleanText(row.birthPlace ?? row.birth_place ?? ""),
    birthDate: cleanText(row.birthDate ?? row.birth_date ?? ""),
    sessionType: cleanText(row.sessionType ?? row.session_type ?? ""),
    searchMode,
    totalScore: source === "concours" || searchMode === "concours" ? score : undefined,
    source,
    rank: Number(row.rank) > 0 ? Number(row.rank) : index + 1,
    originalIndex: index,
  };
  return student.id ? student : null;
}''', "normalize top student", flags=re.S)

replace_exact('''  if (String(source || "").startsWith("upload:")) {
    const response = await fetch(`/api/published-exam-analytics?source=${encodeURIComponent(source)}`, { headers: { Accept: "application/json" } });
    if (!response.ok) throw new Error(await response.text());
    const data = await response.json();
    return {
      stats: normalizeViewStats(data.stats, source),
      regionStats: normalizeStatsRows(data.regionStats, { labelKey: "wilaya" }),
      schoolStats: normalizeStatsRows(data.schoolStats, { labelKey: "school" }),
      trackStats: normalizeStatsRows(data.trackStats, { labelKey: "track" }),
      moughataaStats: normalizeStatsRows(data.moughataaStats, { labelKey: "moughataa" }),
      topStudents: (data.topStudents || []).map((row, index) => normalizeTopStudent(row, source, index)).filter(Boolean),
    };
  }''', '''  if (String(source || "").startsWith("upload:")) {
    const response = await fetch(`/api/published-exam-analytics?source=${encodeURIComponent(source)}`, { headers: { Accept: "application/json" }, cache: "no-store" });
    if (!response.ok) throw new Error(await response.text());
    const data = await response.json();
    const isConcours = Boolean(data?.stats?.isConcours);
    return {
      stats: normalizeViewStats(data.stats, source),
      regionStats: normalizeStatsRows(data.regionStats, { labelKey: "wilaya", isConcours }),
      schoolStats: normalizeStatsRows(data.schoolStats, { labelKey: "school", isConcours }),
      trackStats: normalizeStatsRows(data.trackStats, { labelKey: "track", isConcours }),
      moughataaStats: normalizeStatsRows(data.moughataaStats, { labelKey: "moughataa", isConcours }),
      topStudents: (data.topStudents || []).map((row, index) => normalizeTopStudent({ ...row, isConcours }, source, index)).filter(Boolean),
    };
  }''', "uploaded analytics")

replace_exact('''    const response = await fetch("/api/public-exams", { headers: { Accept: "application/json" } });''', '''    const response = await fetch("/api/public-exams", { headers: { Accept: "application/json" }, cache: "no-store" });''', "public exams fetch")
replace_exact('''      const track = cleanText(getColumn(row, columns.track) || exam?.sessionType || "نتائج");''', '''      const track = columns.track ? cleanText(getColumn(row, columns.track)) : "";''', "uploaded track")
replace_exact('''  const [rankingRows, setRankingRows] = useState([]);const [analyticsViews, setAnalyticsViews] = useState({});''', '''  const [rankingRows, setRankingRows] = useState([]);
  const [analyticsViews, setAnalyticsViews] = useState({});''', "state newline")

replace_re(r'''  const examCards = useMemo\(\(\) => \[\.\.\.EXAM_CARDS, \.\.\.publishedExams\], \[publishedExams\]\);\n  const yearCards = useMemo\(\(\) => YEAR_CARDS\.map\(\(year\) => \{\n.*?\n  \}\), \[examCards\]\);''', '''  const examCards = useMemo(() => [...EXAM_CARDS, ...publishedExams], [publishedExams]);
  const yearCards = useMemo(() => {
    const baseByYear = new Map(YEAR_CARDS.map((year) => [year.id.replace("year-", ""), year]));
    const years = [...new Set(["2025", "2026", ...examCards.map(getExamYear)])]
      .filter((year) => /^20\\d{2}$/.test(year))
      .sort((a, b) => Number(a) - Number(b));
    return years.map((yearValue) => {
      const base = baseByYear.get(yearValue) || {
        id: `year-${yearValue}`,
        title: { ar: `نتائج مسابقات ${yearValue}`, fr: `Résultats des concours ${yearValue}` },
        description: { ar: `النتائج المنشورة لسنة ${yearValue}.`, fr: `Résultats publiés pour ${yearValue}.` },
        tone: "green",
        icon: <GraduationIcon />,
      };
      const available = examCards.some((exam) => exam.available && getExamYear(exam) === yearValue);
      return { ...base, id: `year-${yearValue}`, available };
    });
  }, [examCards]);''', "dynamic years", flags=re.S)

replace_exact('''        : selectedExam?.source === "excellence_1as"
          ? excellenceStudents
          : students;''', '''        : selectedExam?.source === "excellence_1as"
          ? excellenceStudents
          : String(selectedExam?.source || "").startsWith("upload:")
            ? []
            : students;''', "uploaded active students")
replace_exact('''  const showTrackGroups = examHasTrackGroups(selectedExam?.source);
  const showTopperTrackSelector = selectedExam?.source === "bac";''', '''  const showTrackGroups = String(selectedExam?.source || "").startsWith("upload:")
    ? Boolean(selectedExam?.uploadColumns?.track)
    : examHasTrackGroups(selectedExam?.source);
  const showTopperTrackSelector = selectedExam?.source === "bac";''', "show track groups")
replace_exact('''  const analyticsOptions = useMemo(() => analyticsModeOptions(selectedExam?.source, text), [selectedExam?.source, text]);''', '''  const analyticsOptions = useMemo(() => {
    const options = analyticsModeOptions(selectedExam?.source, text);
    if (!String(selectedExam?.source || "").startsWith("upload:")) return options;
    const columns = selectedExam?.uploadColumns || {};
    const enabled = { region: columns.wilaya, track: columns.track, school: columns.school, moughataa: columns.moughataa };
    return options.filter((option) => Boolean(enabled[option.id]));
  }, [selectedExam, text]);''', "analytics options")
replace_exact('''  function showStudent(student) {
    const known = activeStudents.find((item) => item.id === student.id);
    setMatches([]);
    setSelectedStudent(null);''', '''  function showStudent(student) {
    const known = activeStudents.find((item) => item.id === student.id && item.source === student.source);
    setMatches([]);
    setSelectedStudent(null);''', "show student")
replace_exact('''    if (view === "exam" && selectedExam) {
      await loadExamData(selectedExam);
    }''', '''    // Search, rankings, toppers and analytics are server-driven. Avoid downloading
    // entire result tables into the browser when navigating between views.''', "full table load")
replace_exact('''  function openYear(year) {
    if (!year.available) return;
    setSelectedYearId(year.id || "year-2025");
    setActiveView("year");''', '''  function openYear(year) {
    if (!year.available) return;
    const nextYearId = year.id || "year-2025";
    const nextYear = nextYearId.replace("year-", "");
    setSelectedYearId(nextYearId);
    if (selectedExam && getExamYear(selectedExam) !== nextYear) {
      setSelectedExamId("");
      localStorage.removeItem("mauriresults-selected-exam");
    }
    setActiveView("year");''', "open year")
replace_exact('''    writeHashRoute(year.id || "year-2025", { view: "year", yearId: year.id || "year-2025" });''', '''    writeHashRoute(nextYearId, { view: "year", yearId: nextYearId });''', "year route")
replace_exact('''    setSelectedExamId(exam.id);
    localStorage.setItem("mauriresults-selected-exam", exam.id);
    setSelectedTopperTrack("");''', '''    setSelectedExamId(exam.id);
    setSelectedYearId(`year-${getExamYear(exam)}`);
    localStorage.setItem("mauriresults-selected-exam", exam.id);
    setSelectedTopperTrack("");
    setRankingRows([]);
    setRankingTarget(null);''', "open exam")
replace_exact('''    setSelectedExamId(exam.id);
    setSelectedTopperTrack("");
    setMatches([]);''', '''    setSelectedExamId(exam.id);
    setSelectedYearId(`year-${getExamYear(exam)}`);
    localStorage.setItem("mauriresults-selected-exam", exam.id);
    setSelectedTopperTrack("");
    setRankingRows([]);
    setRankingTarget(null);
    setMatches([]);''', "section exam")
replace_exact('''    async function openRanking(field, value, label) {
    if (!value || value === "غير متوفرة" || !selectedExam?.source) return;''', '''  async function openRanking(field, value, label) {
    if (!cleanText(value) || value === "غير متوفرة" || value === "غير متوفر" || !selectedExam?.source) return;''', "ranking indentation")
replace_exact('''  const isConcours = students.some((student) => student.source === "concours");''', '''  const isConcours = students.some(isConcoursStudent);''', "calculate stats concours", 1)
replace_exact('''  const isConcours = students.some((student) => student.source === "concours");''', '''  const isConcours = students.some(isConcoursStudent);''', "summarize concours", 1)
replace_exact('''function ResultCard({ onOpenRanking, resultBanner, student, onShare, text = UI_TEXT.ar, verificationCode }) {
  const average = parseAverage(student.MOD);
  const isConcours = student.source === "concours" || student.searchMode === "concours";
  const status = isConcours ? getConcoursStatus(average, text) : getStatusDisplay(getOfficialStatus(student.kr), text);''', '''function ResultCard({ onOpenRanking, resultBanner, student, onShare, text = UI_TEXT.ar, verificationCode }) {
  const average = parseAverage(student.MOD);
  const isConcours = isConcoursStudent(student);
  const officialStatus = getStatusDisplay(getOfficialStatus(student.kr), text);
  const inferredStatus = average >= 10
    ? { label: text.statusLabels?.admis || "ناجح", icon: <CheckIcon />, className: "admis" }
    : { label: text.statusLabels?.ajourne || "راسب", icon: <XIcon />, className: "ajourne" };
  const status = isConcours ? getConcoursStatus(average, text) : officialStatus.className === "unknown" && !cleanText(student.kr) ? inferredStatus : officialStatus;''', "result status")
replace_re(r'''function ResultExperience\(\{ content, onOpenRanking, onShare, resultBanner, student, text \}\) \{\n  const verificationCode = .*?;\n  const isConcours = .*?;\n  const status = .*?;\n\n  return \(''', '''function ResultExperience({ content, onOpenRanking, onShare, resultBanner, student, text }) {
  const verificationCode = `MR-${student.id}-${String(student.rank || Math.round(getAverage(student) * 100)).padStart(4, "0")}`;

  return (''', "result experience", flags=re.S)
replace_exact('''function CompetitionCards({ currentYearId = "year-2025", examCards = EXAM_CARDS, lang, onSelectExam, selectedExamId, text }) {
  const currentYear = currentYearId.replace("year-", "") || "2025";
  const visibleExamCards = examCards.filter((exam) => getExamYear(exam) === currentYear);
  return (
    <section className="grid grid-cols-2 gap-3">
      {visibleExamCards.map((exam) => (''', '''function CompetitionCards({ currentYearId = "year-2025", examCards = EXAM_CARDS, lang, onSelectExam, selectedExamId, text }) {
  const currentYear = currentYearId.replace("year-", "") || "2025";
  const visibleExamCards = examCards.filter((exam) => exam.available && getExamYear(exam) === currentYear);
  if (!visibleExamCards.length) {
    return <section className="empty-state animate-slide-up"><div><h2>{text.noData}</h2><p>{lang === "fr" ? "Aucun résultat actif n’est publié pour cette année." : "لا توجد نتائج منشورة ومفعلة لهذه السنة حتى الآن."}</p></div></section>;
  }
  return (
    <section className="grid grid-cols-1 gap-3 sm:grid-cols-2">
      {visibleExamCards.map((exam) => (''', "competition cards")
replace_re(r'''function getResultUrl\(student\) \{\n.*?\n\}''', '''function getResultUrl(student) {
  if (typeof window === "undefined") return "https://mauri-results.vercel.app";
  const url = new URL(window.location.href);
  url.searchParams.set("source", cleanText(student?.source));
  url.searchParams.set("candidate", cleanText(student?.id));
  url.hash = "result";
  return url.toString();
}''', "result url", flags=re.S)

s = s.replace('  const [dashboardLoading, setDashboardLoading] = useState(false);', '  const [dashboardLoading] = useState(false);')
p.write_text(s, encoding="utf-8")
print("Home phase 2 applied")
