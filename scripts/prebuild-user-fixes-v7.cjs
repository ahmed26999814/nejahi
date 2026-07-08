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

function insertOnce(anchor, text) {
  if (!s.includes(text.trim().split("\n")[0])) {
    const index = s.indexOf(anchor);
    if (index >= 0) s = s.slice(0, index) + text + s.slice(index);
  }
}

// Bac 2026 uploaded from /admin/results uses table bac26 and ranked view bac26_ranked_results.
replaceOnce(`  bac: BAC_TABLE,\n`, `  bac: BAC_TABLE,\n  bac26: "bac26",\n`);

if (!s.includes('id: "bac-2026"')) {
  replaceOnce(
    `  { id: "bac-2025", title: { ar: "نتائج باكالوريا 2025", fr: "Résultats Bac 2025" }, description: { ar: "النتائج الرسمية للباكالوريا.", fr: "Résultats officiels du baccalauréat." }, tone: "green", available: true, source: "bac", icon: <GraduationIcon /> },`,
    `  { id: "bac-2025", title: { ar: "نتائج باكالوريا 2025", fr: "Résultats Bac 2025" }, description: { ar: "النتائج الرسمية للباكالوريا.", fr: "Résultats officiels du baccalauréat." }, tone: "green", available: true, source: "bac", icon: <GraduationIcon /> },\n  { id: "bac-2026", title: { ar: "نتائج باكالوريا 2026", fr: "Résultats Bac 2026" }, description: { ar: "نتائج الباكالوريا 2026 المرفوعة من ملف XLSX.", fr: "Résultats du Bac 2026 importés depuis XLSX." }, tone: "green", available: true, source: "bac26", icon: <GraduationIcon /> },`
  );
}

replaceOnce(
  `  { id: "year-2026", title: { ar: "نتائج مسابقات 2026", fr: "Résultats des concours 2026" }, description: { ar: "سيتم فتحها عند توفر النتائج.", fr: "Ouverture prochaine." }, available: false, tone: "rose", icon: <AwardIcon /> },`,
  `  { id: "year-2026", title: { ar: "نتائج المسابقات 2026", fr: "Résultats des concours 2026" }, description: { ar: "النتائج الجديدة المرفوعة من لوحة الأدمن.", fr: "Nouveaux résultats importés depuis l'administration." }, available: true, tone: "rose", icon: <AwardIcon /> },`
);

const prepareBac2026Students = `
function prepareBac2026Students(rows) {
  const normalized = rows
    .map((row, index) => {
      const track = cleanText(getColumn(row, "SERIE", "Serie_AR", "Serie_FR", "TS") || "غير محددة");
      return {
        id: String(getColumn(row, "Num_Bac", "Numero", "NODOSS") ?? "").trim(),
        name: cleanText(getColumn(row, "NOM_AR", "Nom_FR", "NOM_FR", "NOM") || "اسم غير متوفر"),
        nameFr: cleanText(getColumn(row, "Nom_FR", "NOM_FR") || ""),
        nameAr: cleanText(getColumn(row, "NOM_AR") || ""),
        ts: track,
        track,
        MOD: getColumn(row, "Moy_Bac", "MOD", "Moyenne"),
        rankFromDb: Number(getColumn(row, "rank", "Rank", "RANK")) || null,
        kr: cleanText(getColumn(row, "Decision", "KR") || ""),
        wl: cleanText(getColumn(row, "Wilaya_AR", "Wilaya_FR", "WL") || ""),
        moughataa: "",
        ms: cleanText(getColumn(row, "Etablissement_AR", "Etablissement_FR", "MS") || ""),
        centre: cleanText(getColumn(row, "Centre Examen AR", "Centre Examen_AR", "Centre Examen FR", "Centre Examen_FR", "Centre") || ""),
        birthPlace: cleanText(getColumn(row, "Lieu_AR", "Lieu_FR", "LIEUNN_AR", "LIEUN_FR") || ""),
        birthDate: cleanText(getColumn(row, "Date Naiss", "DATN") || ""),
        nationalId: cleanText(getColumn(row, "NNI") || ""),
        sessionType: "باكالوريا 2026",
        source: "bac26",
        originalIndex: index,
      };
    })
    .filter((student) => student.id);

  const sorted = [...normalized].sort((a, b) => getAverage(b) - getAverage(a) || a.originalIndex - b.originalIndex);
  sorted.forEach((student, index) => {
    student.rank = student.rankFromDb || index + 1;
  });

  return [...new Map(sorted.map((student) => [student.id, student])).values()];
}
`;
insertOnce("function prepareBacSessionStudents", prepareBac2026Students);

replaceOnce(
  `function examHasTrackGroups(source) {\n  return source === "bac" || source === "bac_session";\n}`,
  `function examHasTrackGroups(source) {\n  return source === "bac" || source === "bac26" || source === "bac_session";\n}`
);
replaceOnce(
  `if (source === "bac") return [{ id: "region", label: text.byRegions }, { id: "track", label: text.byTracks }];`,
  `if (source === "bac" || source === "bac26") return [{ id: "region", label: text.byRegions }, { id: "track", label: text.byTracks }];`
);
replaceOnce(
  `  const showTopperTrackSelector = selectedExam?.source === "bac";`,
  `  const showTopperTrackSelector = selectedExam?.source === "bac" || selectedExam?.source === "bac26";`
);

const rankingHelpers = `
function prepareRowsForSource(source, rows) {
  if (source === "bac26") return prepareBac2026Students(rows);
  if (source === "brevet") return prepareBrevetStudents(rows);
  if (source === "concours") return prepareConcoursStudents(rows);
  if (source === "bac_session") return prepareBacSessionStudents(rows);
  if (source === "excellence_1as") return prepareExcellenceStudents(rows);
  return prepareStudents(rows);
}

function sourceRowId(source, row) {
  if (source === "bac26") return String(getColumn(row, "Num_Bac", "Numero") ?? "").trim();
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
} else {
  s = s.replace(/function prepareRowsForSource\(source, rows\) \{[\s\S]*?function preserveSourceRanks\(source, rows, students\) \{[\s\S]*?\n\}/, rankingHelpers.trim());
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

      if (selectedExam.source === "bac" || selectedExam.source === "bac26") setStudents(rows);
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

// Show result immediately after search; no artificial delay.
s = s.replace(/\},\s*120\);/g, "}, 20);");
s = s.replace(/\},\s*520\);/g, "}, 20);");

// Make sure the user-facing loading wording is clear.
s = s.replace(/جاري تحضير بطاقة النتيجة/g, "جاري تحضير النتيجة");
s = s.replace(/جاري فتح بطاقة النتيجة/g, "جاري عرض النتيجة");
s = s.replace(/جاري عرض بطاقة النتيجة/g, "جاري عرض النتيجة");

fs.writeFileSync(p, s, "utf8");
console.log("Applied MauriResults no-preload direct API search and ranking v7");
