require("./prebuild-user-fixes-v6.cjs");

const fs = require("fs");
const p = "app/page.jsx";
let s = fs.readFileSync(p, "utf8");

function findFunctionBounds(name) {
  for (const marker of [`async function ${name}(`, `function ${name}(`]) {
    const start = s.indexOf(marker);
    if (start < 0) continue;
    const paramsStart = s.indexOf("(", start);
    let parens = 0;
    let bodyStart = -1;
    for (let i = paramsStart; i < s.length; i++) {
      if (s[i] === "(") parens++;
      if (s[i] === ")") parens--;
      if (parens === 0) {
        bodyStart = s.indexOf("{", i);
        break;
      }
    }
    if (bodyStart < 0) continue;
    let braces = 0;
    for (let i = bodyStart; i < s.length; i++) {
      if (s[i] === "{") braces++;
      if (s[i] === "}") braces--;
      if (braces === 0) return { start, end: i + 1 };
    }
  }
  throw new Error("Function not found: " + name);
}

function replaceFunction(name, next) {
  const bounds = findFunctionBounds(name);
  s = s.slice(0, bounds.start) + next + s.slice(bounds.end);
}

function replaceOnce(search, replacement) {
  if (s.includes(search)) s = s.replace(search, replacement);
}

const routeHelpers = `
function getInitialRouteState() {
  if (typeof window === "undefined") return { view: "home", examId: "" };
  const hash = window.location.hash.replace("#", "").trim();
  const savedExamId = localStorage.getItem("mauriresults-selected-exam") || "bac-2025";
  const knownExam = EXAM_CARDS.find((exam) => exam.id === hash && exam.available);

  if (knownExam || hash.startsWith("upload-")) return { view: "exam", examId: hash || savedExamId };
  if (hash === "year" || hash === "year-2025" || hash === "year-2026") return { view: "year", examId: savedExamId };
  if (["analytics", "toppers", "contact"].includes(hash)) return { view: hash, examId: savedExamId };
  return { view: "home", examId: savedExamId };
}
`;

const publishedHelpers = `
function buildPublishedExamCards(rows = []) {
  return rows
    .filter((row) => row?.table_name && row?.source_key && row?.number_column && row?.name_column && row?.score_column)
    .map((row) => ({
      id: "upload-" + row.table_name,
      title: { ar: row.title_ar || row.table_name, fr: row.title_fr || row.title_ar || row.table_name },
      description: { ar: row.description_ar || "نتائج منشورة من لوحة الأدمن.", fr: row.description_fr || "Résultats publiés depuis l'administration." },
      tone: row.tone || "green",
      available: true,
      source: row.source_key,
      icon: <GraduationIcon />,
      tableName: row.table_name,
      uploadColumns: {
        number: row.number_column,
        name: row.name_column,
        score: row.score_column,
        decision: row.decision_column,
        track: row.track_column,
        wilaya: row.wilaya_column,
        school: row.school_column,
        centre: row.centre_column,
        birthPlace: row.birth_place_column,
        birthDate: row.birth_date_column,
      },
      sessionType: row.title_ar || row.table_name,
      year: row.year || "2026",
    }));
}

async function fetchPublishedExams() {
  try {
    const response = await fetch("/api/public-exams", { headers: { Accept: "application/json" } });
    if (!response.ok) return [];
    const data = await response.json();
    return buildPublishedExamCards(data.exams || []);
  } catch (error) {
    console.warn("[MauriResults Published Exams]", error);
    return [];
  }
}

function prepareUploadedStudents(rows, exam) {
  const columns = exam?.uploadColumns || {};
  const normalized = rows
    .map((row, index) => {
      const track = cleanText(getColumn(row, columns.track) || exam?.sessionType || "نتائج");
      return {
        id: String(getColumn(row, columns.number) ?? "").trim(),
        name: cleanText(getColumn(row, columns.name) || "اسم غير متوفر"),
        track,
        ts: track,
        MOD: getColumn(row, columns.score),
        rankFromDb: Number(getColumn(row, "rank", "Rank", "RANK")) || null,
        kr: cleanText(getColumn(row, columns.decision) || ""),
        wl: cleanText(getColumn(row, columns.wilaya) || ""),
        moughataa: "",
        ms: cleanText(getColumn(row, columns.school) || ""),
        centre: cleanText(getColumn(row, columns.centre) || ""),
        birthPlace: cleanText(getColumn(row, columns.birthPlace) || ""),
        birthDate: cleanText(getColumn(row, columns.birthDate) || ""),
        sessionType: exam?.sessionType || exam?.title?.ar || "نتائج منشورة",
        source: exam?.source || "upload",
        originalIndex: index,
      };
    })
    .filter((student) => student.id);

  const sorted = [...normalized].sort((a, b) => getAverage(b) - getAverage(a) || a.originalIndex - b.originalIndex);
  sorted.forEach((student, index) => { student.rank = student.rankFromDb || index + 1; });
  return [...new Map(sorted.map((student) => [student.id, student])).values()];
}
`;

const rankingHelpers = `
function prepareRowsForSource(source, rows) {
  if (source === "brevet") return prepareBrevetStudents(rows);
  if (source === "concours") return prepareConcoursStudents(rows);
  if (source === "bac_session") return prepareBacSessionStudents(rows);
  if (source === "excellence_1as") return prepareExcellenceStudents(rows);
  return prepareStudents(rows);
}

function prepareRowsForExam(exam, rows) {
  if (exam?.source?.startsWith("upload:")) return prepareUploadedStudents(rows, exam);
  return prepareRowsForSource(exam?.source, rows);
}

function sourceRowId(source, row) {
  if (source === "brevet") return String(getColumn(row, "Num_Bepc", "num_bepc", "NUM_BEPC") ?? "").trim();
  if (source === "concours") return String(getColumn(row, "Numéro_C1AS", "Numero_C1AS") ?? "").trim();
  if (source === "bac_session") return String(getColumn(row, "NODOSS") ?? "").trim();
  if (source === "excellence_1as") return String(getColumn(row, "Num_Excellence_1AS") ?? "").trim();
  return String(getColumn(row, "Numero", "numero", "NUMERO") ?? "").trim();
}

function preserveSourceRanks(source, rows, students) {
  const rankById = new Map(
    rows
      .map((row) => [sourceRowId(source, row), Number(getColumn(row, "rank"))])
      .filter(([id, rank]) => id && Number.isFinite(rank) && rank > 0)
  );
  if (!rankById.size) return students;
  return students.map((student) => rankById.has(student.id) ? { ...student, rank: rankById.get(student.id) } : student);
}
`;

if (!s.includes("function getInitialRouteState()")) {
  s = s.replace("\nexport default function HomePage() {", `${routeHelpers}\nexport default function HomePage() {`);
}
if (!s.includes("function buildPublishedExamCards(rows = [])")) {
  s = s.replace("\nexport default function HomePage() {", `${publishedHelpers}\nexport default function HomePage() {`);
}
if (!s.includes("function prepareRowsForSource(source, rows)")) {
  s = s.replace("\nexport default function HomePage() {", `${rankingHelpers}\nexport default function HomePage() {`);
}

// Dynamic public exam state.
replaceOnce(
  `  const [analyticsViews, setAnalyticsViews] = useState({});
  const [analyticsLoadingSources, setAnalyticsLoadingSources] = useState({});`,
  `  const [analyticsViews, setAnalyticsViews] = useState({});
  const [analyticsLoadingSources, setAnalyticsLoadingSources] = useState({});
  const [publishedExams, setPublishedExams] = useState([]);`
);
replaceOnce(
  `  const selectedExam = useMemo(() => EXAM_CARDS.find((exam) => exam.id === selectedExamId), [selectedExamId]);`,
  `  const examCards = useMemo(() => [...EXAM_CARDS, ...publishedExams], [publishedExams]);
  const selectedExam = useMemo(() => examCards.find((exam) => exam.id === selectedExamId), [examCards, selectedExamId]);`
);
if (!s.includes("fetchPublishedExams().then")) {
  replaceOnce(
    `  useEffect(() => {
    let ignore = false;
    fetchSiteContent().then((content) => {`,
    `  useEffect(() => {
    let ignore = false;
    fetchPublishedExams().then((exams) => { if (!ignore) setPublishedExams(exams); });
    fetchSiteContent().then((content) => {`
  );
}

// Keep the same page after refresh instead of always returning to home.
s = s.replace(
  `  const [activeView, setActiveView] = useState("home");
  const [selectedExamId, setSelectedExamId] = useState("");`,
  `  const [activeView, setActiveView] = useState(() => getInitialRouteState().view);
  const [selectedExamId, setSelectedExamId] = useState(() => getInitialRouteState().examId);`
);
s = s.replace(
  `    window.history.replaceState({ view: "home" }, "", window.location.pathname);`,
  `    const initialRoute = getInitialRouteState();
    window.history.replaceState({ view: initialRoute.view }, "", window.location.hash ? window.location.pathname + window.location.hash : window.location.pathname);`
);
if (!s.includes('localStorage.setItem("mauriresults-selected-exam", selectedExamId)')) {
  s = s.replace(
    `  useEffect(() => {
    const favicon = contentValue(siteContent, "favicon");`,
    `  useEffect(() => {
    if (selectedExamId) localStorage.setItem("mauriresults-selected-exam", selectedExamId);
  }, [selectedExamId]);

  useEffect(() => {
    const favicon = contentValue(siteContent, "favicon");`
  );
}

replaceFunction("searchResults", `async function searchResults(query, exam) {
   if (!exam?.source) throw new Error("Missing selected exam.");
   const response = await fetch(\`/api/search?source=\${encodeURIComponent(exam.source)}&q=\${encodeURIComponent(query.trim())}\`, {
     headers: { Accept: "application/json" },
   });
   if (!response.ok) throw new Error(await response.text());
   const data = await response.json();
   const rows = data.rows || [];
   return preserveSourceRanks(exam.source, rows, prepareRowsForExam(exam, rows));
 }`);

// المرحلة الأولى: لا تحميل مسبق لجداول النتائج داخل المتصفح.
s = s.replace(`  const searchPool = useMemo(() => {
     return activeStudents;
   }, [activeStudents]);`, `  const searchPool = useMemo(() => [], []);`);

s = s.replace(`  function showStudent(student) {
     const known = activeStudents.find((item) => item.id === student.id);
     setMatches([]);
     setSelectedStudent(null);
     setResultPageOpen(false);
     setResultLoading(true);
     window.setTimeout(() => {
       setSelectedStudent(known || student);`, `  function showStudent(student) {
     setMatches([]);
     setSelectedStudent(null);
     setResultPageOpen(false);
     setResultLoading(true);
     window.setTimeout(() => {
       setSelectedStudent(student);`);

s = s.replace(`    if (view === "exam" && selectedExam) {
       await loadExamData(selectedExam);
     }
 `, "");

s = s.replace(`  const suggestions = useMemo(() => {
     const value = cleanText(query).toLowerCase();
     if (!selectedExam?.available || selectedExam.source === "concours" || value.length < 2 || resultPageOpen || matches.length) return [];
     return searchPool
       .filter((student) => cleanText(student.id).toLowerCase().includes(value) || cleanText(student.name).toLowerCase().includes(value))
       .slice(0, 5);
   }, [matches.length, query, resultPageOpen, searchPool, selectedExam]);`, `  const suggestions = useMemo(() => [], []);`);

s = s.replace(`      const rankingPool = selectedExam?.source === "bac" ? await loadExamData(selectedExam) : searchPool;
       const rows = await searchResults(value, selectedExam);
       const found = rows.map((student) => {
         const known = rankingPool.find((item) => normalizeCandidateNumber(item.id) === normalizeCandidateNumber(student.id));
         return known ? { ...student, rank: known.rank } : student;
       }).filter((student) => selectedExam?.filter === "sessionnaire" ? getOfficialStatus(student.kr).className === "sessionnaire" : true);`, `      const rows = await searchResults(value, selectedExam);
       const found = rows.filter((student) => selectedExam?.filter === "sessionnaire" ? getOfficialStatus(student.kr).className === "sessionnaire" : true);`);

replaceFunction("openRanking", `async function openRanking(field, value, label) {
    if (!value || value === "غير متوفرة" || !selectedExam?.source || selectedExam.source.startsWith("upload:")) return;
    setExamLoading(true);
    try {
      const params = new URLSearchParams({ source: selectedExam.source, field, value });
      const response = await fetch(\`/api/ranking?\${params.toString()}\`, { headers: { Accept: "application/json" } });
      if (!response.ok) throw new Error(await response.text());
      const data = await response.json();
      const rows = prepareRowsForSource(selectedExam.source, data.rows || []);

      if (selectedExam.source === "bac") setStudents(rows);
      else if (selectedExam.source === "brevet") setBrevetStudents(rows);
      else if (selectedExam.source === "bac_session") setBacSessionStudents(rows);
      else if (selectedExam.source === "concours") setConcoursStudents(rows);
      else if (selectedExam.source === "excellence_1as") setExcellenceStudents(rows);

      setRankingTarget({ field, value, label });
      setActiveView("ranking");
      window.history.pushState({ view: "ranking" }, "", "#ranking");
      window.setTimeout(() => window.scrollTo({ top: 0, behavior: "smooth" }), 0);
    } catch (error) {
      console.error("[MauriResults Ranking Error]", error);
      setError(isMissingSupabaseEnv(error) ? text.missingEnv : text.connectionError);
    } finally {
      setExamLoading(false);
    }
  }`);

// Use dynamic examCards for year page and selectors.
s = s.replace(
  `{activeView === "year" && <YearPage lang={lang} onSelectExam={openExam} selectedExamId={selectedExamId} text={text} />}`,
  `{activeView === "year" && <YearPage examCards={examCards} lang={lang} onSelectExam={openExam} selectedExamId={selectedExamId} text={text} />}`
);
s = s.replace(`const exam = EXAM_CARDS.find((item) => item.id === examId);`, `const exam = examCards.find((item) => item.id === examId);`);
s = s.replace(`function YearPage({ lang, onSelectExam, selectedExamId, text }) {`, `function YearPage({ examCards = EXAM_CARDS, lang, onSelectExam, selectedExamId, text }) {`);
s = s.replace(`<CompetitionCards lang={lang} onSelectExam={onSelectExam} selectedExamId={selectedExamId} text={text} />`, `<CompetitionCards examCards={examCards} lang={lang} onSelectExam={onSelectExam} selectedExamId={selectedExamId} text={text} />`);
s = s.replace(`function CompetitionCards({ lang, onSelectExam, selectedExamId, text }) {`, `function CompetitionCards({ examCards = EXAM_CARDS, lang, onSelectExam, selectedExamId, text }) {`);
s = s.replace(`{EXAM_CARDS.map((exam) => (`, `{examCards.map((exam) => (`);

// بطاقة القرار مرة واحدة.
if (!s.includes('key="decision"')) {
  s = s.replace(`[text.exam || "المسابقة", "أبريفه 2025", <BookIcon key="exam" />],`, `[text.exam || "المسابقة", "أبريفه 2025", <BookIcon key="exam" />],\n      [text.decision || "القرار", status.label, <InfoIcon key="decision" />],`);
  s = s.replace(`[text.exam || "المسابقة", student.sessionType || "البكالوريا الدورة التكميلية 2025", <BookIcon key="exam" />],`, `[text.exam || "المسابقة", student.sessionType || "البكالوريا الدورة التكميلية 2025", <BookIcon key="exam" />],\n        [text.decision || "القرار", status.label, <InfoIcon key="decision" />],`);
  s = s.replace(`[text.exam || "المسابقة", "كونكور 2025", <BookIcon key="exam" />],`, `[text.exam || "المسابقة", "كونكور 2025", <BookIcon key="exam" />],\n          [text.decision || "القرار", status.label, <InfoIcon key="decision" />],`);
  s = s.replace(`[text.exam || "المسابقة", "الامتياز الأولى إعدادية 2025", <BookIcon key="exam" />],`, `[text.exam || "المسابقة", "الامتياز الأولى إعدادية 2025", <BookIcon key="exam" />],\n            [text.decision || "القرار", status.label, <InfoIcon key="decision" />],`);
  s = s.replace(`[text.exam || "المسابقة", student.sessionType || "البكالوريا 2025", <BookIcon key="exam" />],`, `[text.exam || "المسابقة", student.sessionType || "البكالوريا 2025", <BookIcon key="exam" />],\n      [text.decision || "القرار", status.label, <InfoIcon key="decision" />],`);
}

// أغلق زر السنة 2026 القديم فقط؛ النتائج المنشورة ستظهر كبطاقات مستقلة داخل صفحة الاختيار.
s = s.replace(/\n\s*\{ id: "bac-2026",[\s\S]*?source: "bac26", icon: <GraduationIcon \/> \},/g, "");
s = s.replace(/\n\s*bac26: "bac26",/g, "");
s = s.replace(/\{ id: "year-2026", title: \{ ar: "[^"]+", fr: "[^"]+" \}, description: \{ ar: "[^"]+", fr: "[^"]+" \}, available: true, tone: "rose", icon: <AwardIcon \/> \}/g, `{ id: "year-2026", title: { ar: "نتائج مسابقات 2026", fr: "Résultats des concours 2026" }, description: { ar: "سيتم فتحها عند توفر النتائج الرسمية.", fr: "Ouverture prochaine." }, available: false, tone: "rose", icon: <AwardIcon /> }`);

s = s.replace(/\},\s*120\);/g, "}, 20);");
s = s.replace(/\},\s*520\);/g, "}, 20);");
s = s.replace(/جاري تحضير بطاقة النتيجة/g, "جاري تحضير النتيجة");
s = s.replace(/جاري فتح بطاقة النتيجة/g, "جاري عرض النتيجة");
s = s.replace(/جاري عرض بطاقة النتيجة/g, "جاري عرض النتيجة");

fs.writeFileSync(p, s, "utf8");
console.log("Applied MauriResults no-preload direct API search and ranking v7");
