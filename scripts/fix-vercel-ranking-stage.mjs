import { readFileSync, writeFileSync } from "node:fs";

const file = "app/page.jsx";
let source = readFileSync(file, "utf8");
const original = source;

function replaceNamedFunction(name, next) {
  for (const marker of [`async function ${name}(`, `function ${name}(`]) {
    const start = source.indexOf(marker);
    if (start < 0) continue;
    const bodyStart = source.indexOf("{", start);
    if (bodyStart < 0) continue;
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
  }
  return false;
}

source = source.replace(
  `\n\n  const compactDetails = details.filter(([label]) => label !== text.id && label !== (text.exam || "المسابقة"));\n\n  useEffect(() => {`,
  `\n\n  useEffect(() => {`
);

source = source.replace(
  `<PremiumHomeView\n      homepageBanner={homepageBanner}`,
  `<PremiumHomeView\n      content={content}\n      homepageBanner={homepageBanner}`
);

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
replaceNamedFunction("openRanking", openRankingNew);

if (source !== original) {
  writeFileSync(file, source, "utf8");
  console.log("Ranking stage fixed.");
} else {
  console.log("No ranking stage changes needed.");
}
