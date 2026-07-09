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

const rankingHelpers = `
function prepareRowsForSource(source, rows) {
  if (source === "brevet") return prepareBrevetStudents(rows);
  if (source === "concours") return prepareConcoursStudents(rows);
  if (source === "bac_session") return prepareBacSessionStudents(rows);
  if (source === "excellence_1as") return prepareExcellenceStudents(rows);
  return prepareStudents(rows);
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

if (!s.includes("function prepareRowsForSource(source, rows)")) {
  s = s.replace("\nexport default function HomePage() {", `${rankingHelpers}\nexport default function HomePage() {`);
}

replaceFunction("searchResults", `async function searchResults(query, exam) {
   if (!exam?.source) throw new Error("Missing selected exam.");
   const response = await fetch(\`/api/search?source=\${encodeURIComponent(exam.source)}&q=\${encodeURIComponent(query.trim())}\`, {
     headers: { Accept: "application/json" },
   });
   if (!response.ok) throw new Error(await response.text());
   const data = await response.json();
   const rows = data.rows || [];
   return preserveSourceRanks(exam.source, rows, prepareRowsForSource(exam.source, rows));
 }`);

// المرحلة الأولى: لا تحميل مسبق لجداول النتائج داخل المتصفح.
// الصفحة الرئيسية وصفحة اختيار المسابقة لا تحمل bac_results أو brevet أو غيرها.
s = s.replace(`  const searchPool = useMemo(() => {
     return activeStudents;
   }, [activeStudents]);`, `  const searchPool = useMemo(() => [], []);`);

// لا تبحث داخل آلاف الطلاب المحملين في الذاكرة عند فتح نتيجة واحدة.
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

// Never preload every row when opening the exam page. Search is request-only.
s = s.replace(`    if (view === "exam" && selectedExam) {
       await loadExamData(selectedExam);
     }
 `, "");

// لا تعتمد الاقتراحات على قاعدة بيانات محملة في المتصفح.
s = s.replace(`  const suggestions = useMemo(() => {
     const value = cleanText(query).toLowerCase();
     if (!selectedExam?.available || selectedExam.source === "concours" || value.length < 2 || resultPageOpen || matches.length) return [];
     return searchPool
       .filter((student) => cleanText(student.id).toLowerCase().includes(value) || cleanText(student.name).toLowerCase().includes(value))
       .slice(0, 5);
   }, [matches.length, query, resultPageOpen, searchPool, selectedExam]);`, `  const suggestions = useMemo(() => [], []);`);

// Keep search request-only and keep the rank returned by /api/search.
s = s.replace(`      const rankingPool = selectedExam?.source === "bac" ? await loadExamData(selectedExam) : searchPool;
       const rows = await searchResults(value, selectedExam);
       const found = rows.map((student) => {
         const known = rankingPool.find((item) => normalizeCandidateNumber(item.id) === normalizeCandidateNumber(student.id));
         return known ? { ...student, rank: known.rank } : student;
       }).filter((student) => selectedExam?.filter === "sessionnaire" ? getOfficialStatus(student.kr).className === "sessionnaire" : true);`, `      const rows = await searchResults(value, selectedExam);
       const found = rows.filter((student) => selectedExam?.filter === "sessionnaire" ? getOfficialStatus(student.kr).className === "sessionnaire" : true);`);

// فتح التصنيف يتم عبر /api/ranking مباشرة، لا عبر تحميل جدول المسابقة كاملًا.
replaceFunction("openRanking", `async function openRanking(field, value, label) {
    if (!value || value === "غير متوفرة" || !selectedExam?.source) return;
    setExamLoading(true);
    try {
      const params = new URLSearchParams({ source: selectedExam.source, field, value });
      const response = await fetch(\`/api/ranking?\${params.toString()}\`, {
        headers: { Accept: "application/json" },
      });
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

// أعد بطاقة القرار مرة واحدة داخل تفاصيل النتيجة، مع بقاء الشارة العليا كما هي.
if (!s.includes('key="decision"')) {
  s = s.replace(
    `[text.exam || "المسابقة", "أبريفه 2025", <BookIcon key="exam" />],`,
    `[text.exam || "المسابقة", "أبريفه 2025", <BookIcon key="exam" />],\n      [text.decision || "القرار", status.label, <InfoIcon key="decision" />],`
  );
  s = s.replace(
    `[text.exam || "المسابقة", student.sessionType || "البكالوريا الدورة التكميلية 2025", <BookIcon key="exam" />],`,
    `[text.exam || "المسابقة", student.sessionType || "البكالوريا الدورة التكميلية 2025", <BookIcon key="exam" />],\n        [text.decision || "القرار", status.label, <InfoIcon key="decision" />],`
  );
  s = s.replace(
    `[text.exam || "المسابقة", "كونكور 2025", <BookIcon key="exam" />],`,
    `[text.exam || "المسابقة", "كونكور 2025", <BookIcon key="exam" />],\n          [text.decision || "القرار", status.label, <InfoIcon key="decision" />],`
  );
  s = s.replace(
    `[text.exam || "المسابقة", "الامتياز الأولى إعدادية 2025", <BookIcon key="exam" />],`,
    `[text.exam || "المسابقة", "الامتياز الأولى إعدادية 2025", <BookIcon key="exam" />],\n            [text.decision || "القرار", status.label, <InfoIcon key="decision" />],`
  );
  s = s.replace(
    `[text.exam || "المسابقة", student.sessionType || "البكالوريا 2025", <BookIcon key="exam" />],`,
    `[text.exam || "المسابقة", student.sessionType || "البكالوريا 2025", <BookIcon key="exam" />],\n      [text.decision || "القرار", status.label, <InfoIcon key="decision" />],`
  );
}

// أغلق 2026 حتى لا تظهر نتائج تجريبية أو ملفات مرفوعة بالخطأ.
s = s.replace(/\n\s*\{ id: "bac-2026",[\s\S]*?source: "bac26", icon: <GraduationIcon \/> \},/g, "");
s = s.replace(/\n\s*bac26: "bac26",/g, "");
s = s.replace(
  /\{ id: "year-2026", title: \{ ar: "[^"]+", fr: "[^"]+" \}, description: \{ ar: "[^"]+", fr: "[^"]+" \}, available: true, tone: "rose", icon: <AwardIcon \/> \}/g,
  `{ id: "year-2026", title: { ar: "نتائج مسابقات 2026", fr: "Résultats des concours 2026" }, description: { ar: "سيتم فتحها عند توفر النتائج الرسمية.", fr: "Ouverture prochaine." }, available: false, tone: "rose", icon: <AwardIcon /> }`
);

// Show result immediately after search; no artificial 520ms delay.
s = s.replace(/\},\s*120\);/g, "}, 20);");
s = s.replace(/\},\s*520\);/g, "}, 20);");

// Make sure the user-facing loading wording is clear.
s = s.replace(/جاري تحضير بطاقة النتيجة/g, "جاري تحضير النتيجة");
s = s.replace(/جاري فتح بطاقة النتيجة/g, "جاري عرض النتيجة");
s = s.replace(/جاري عرض بطاقة النتيجة/g, "جاري عرض النتيجة");

fs.writeFileSync(p, s, "utf8");
console.log("Applied MauriResults no-preload direct API search and ranking v7");
