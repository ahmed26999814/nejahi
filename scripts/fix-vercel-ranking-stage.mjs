import { readFileSync, writeFileSync } from "node:fs";

const file = "app/page.jsx";
let source = readFileSync(file, "utf8");
const original = source;

function replaceFunction(name, next) {
  const marker = `function ${name}(`;
  const start = source.indexOf(marker);
  if (start < 0) return false;
  const bodyStart = source.indexOf("{", start);
  if (bodyStart < 0) return false;
  let depth = 0;
  for (let i = bodyStart; i < source.length; i += 1) {
    const char = source[i];
    if (char === "{") depth += 1;
    if (char === "}") depth -= 1;
    if (depth === 0) {
      source = source.slice(0, start) + next + source.slice(i + 1);
      return true;
    }
  }
  return false;
}

const rankingMemoOld = `  const rankingStudents = useMemo(() => {
    if (!rankingTarget) return [];
    const target = normalizeComparable(rankingTarget.value);
    return activeStudents
      .filter((student) => normalizeComparable(student[rankingTarget.field]) === target)
      .sort((a, b) => getAverage(b) - getAverage(a) || a.originalIndex - b.originalIndex);
  }, [activeStudents, rankingTarget]);`;
const rankingMemoNew = `  const rankingStudents = useMemo(() => {
    if (!rankingTarget) return [];
    if (rankingRows.length) return [...rankingRows].sort((a, b) => getAverage(b) - getAverage(a) || a.originalIndex - b.originalIndex);
    const target = normalizeComparable(rankingTarget.value);
    return activeStudents
      .filter((student) => normalizeComparable(student[rankingTarget.field]) === target)
      .sort((a, b) => getAverage(b) - getAverage(a) || a.originalIndex - b.originalIndex);
  }, [activeStudents, rankingRows, rankingTarget]);`;
if (source.includes(rankingMemoOld)) source = source.replace(rankingMemoOld, rankingMemoNew);

const submitOld = `const rows = await searchResults(value, selectedExam);
      const found = rows.map((student) => {
        const known = searchPool.find((item) => item.id === student.id);
        return known ? { ...student, rank: known.rank } : student;
      }).filter((student) => selectedExam?.filter === "sessionnaire" ? getOfficialStatus(student.kr).className === "sessionnaire" : true);`;
const submitNew = `const rankingPool = selectedExam?.source === "bac" ? await loadExamData(selectedExam) : searchPool;
      const rows = await searchResults(value, selectedExam);
      const found = rows.map((student) => {
        const known = rankingPool.find((item) => normalizeCandidateNumber(item.id) === normalizeCandidateNumber(student.id));
        return known ? { ...student, rank: known.rank } : student;
      }).filter((student) => selectedExam?.filter === "sessionnaire" ? getOfficialStatus(student.kr).className === "sessionnaire" : true);`;
if (source.includes(submitOld)) source = source.replace(submitOld, submitNew);

const openRankingNew = `  async function openRanking(field, value, label) {
    if (!value || value === "غير متوفرة" || value === text.unavailable) return;
    setRankingRows([]);
    setRankingTarget({ field, value, label });
    setActiveView("ranking");
    window.history.pushState({ view: "ranking" }, "", "#ranking");
    window.setTimeout(() => window.scrollTo({ top: 0, behavior: "smooth" }), 0);

    setExamLoading(true);
    try {
      const rows = await fetchFastRankingResults(selectedExam?.source, field, value);
      setRankingRows(rows);
    } catch (error) {
      console.error("[MauriResults Ranking Error]", error);
      setError(isMissingSupabaseEnv(error) ? text.missingEnv : text.connectionError);
    } finally {
      setExamLoading(false);
    }
  }`;
replaceFunction("openRanking", openRankingNew);

const resetMarkers = [
  "setMatches([]);\n    setError(\"\");\n    setMessage(\"\");",
  "setMatches([]);\n    setSelectedStudent(null);\n    setResultPageOpen(false);\n    setError(\"\");\n    setMessage(\"\");"
];
for (const marker of resetMarkers) {
  const replacement = marker.replace('setMessage("");', 'setMessage("");\n    setRankingRows([]);');
  if (source.includes(marker) && !source.includes(replacement)) source = source.replace(marker, replacement);
}

if (source !== original) {
  writeFileSync(file, source, "utf8");
  console.log("Vercel ranking stage fixed.");
} else {
  console.log("No Vercel ranking stage changes needed.");
}
