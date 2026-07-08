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

replaceFunction("searchResults", `async function searchResults(query, exam) {
  if (!exam?.source) throw new Error("Missing selected exam.");
  const response = await fetch(\`/api/search?source=\${encodeURIComponent(exam.source)}&q=\${encodeURIComponent(query.trim())}\`, {
    headers: { Accept: "application/json" },
  });
  if (!response.ok) throw new Error(await response.text());
  const data = await response.json();
  const rows = data.rows || [];

  if (exam.source === "brevet") return prepareBrevetStudents(rows);
  if (exam.source === "concours") return prepareConcoursStudents(rows);
  if (exam.source === "bac_session") return prepareBacSessionStudents(rows);
  if (exam.source === "excellence_1as") return prepareExcellenceStudents(rows);
  return prepareStudents(rows);
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

// Keep ranking pages lazy; they may load only when explicitly opened, not during search.
s = s.replace(`      const rankingPool = selectedExam?.source === "bac" ? await loadExamData(selectedExam) : searchPool;
      const rows = await searchResults(value, selectedExam);
      const found = rows.map((student) => {
        const known = rankingPool.find((item) => normalizeCandidateNumber(item.id) === normalizeCandidateNumber(student.id));
        return known ? { ...student, rank: known.rank } : student;
      }).filter((student) => selectedExam?.filter === "sessionnaire" ? getOfficialStatus(student.kr).className === "sessionnaire" : true);`, `      const rows = await searchResults(value, selectedExam);
      const found = rows.filter((student) => selectedExam?.filter === "sessionnaire" ? getOfficialStatus(student.kr).className === "sessionnaire" : true);`);

// في حال بقيت نسخة قديمة من openRanking، امنع تحميل الجدول كاملًا.
s = s.replace(`    } else {
      await loadExamData(selectedExam);
    }
    setRankingTarget({ field, value, label });`, `    }
    setRankingTarget({ field, value, label });`);

// Show result immediately after search; no artificial 520ms delay.
s = s.replace(/\},\s*120\);/g, "}, 20);");
s = s.replace(/\},\s*520\);/g, "}, 20);");

// Make sure the user-facing loading wording is clear.
s = s.replace(/جاري تحضير بطاقة النتيجة/g, "جاري تحضير النتيجة");
s = s.replace(/جاري فتح بطاقة النتيجة/g, "جاري عرض النتيجة");
s = s.replace(/جاري عرض بطاقة النتيجة/g, "جاري عرض النتيجة");

fs.writeFileSync(p, s, "utf8");
console.log("Applied MauriResults no-preload direct API search v7");
