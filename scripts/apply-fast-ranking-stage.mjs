import { readFileSync, writeFileSync } from "node:fs";

const file = "app/page.jsx";
let source = readFileSync(file, "utf8");
const original = source;

const helperAnchor = `async function fetchConcoursFilteredResults(field, value) {
  const columnByField = {
    wl: "WILAYA_AR",
    moughataa: "MOUGHATAA_AR",
    centre: "Centre Examen_AR",
    ms: "Ecole_AR",
    track: "TYPE",
  };
  const column = columnByField[field];
  if (!column || !value) return [];
  const filterValue = field === "wl"
    ? postgrestInFilter(concoursWilayaQueryValues(value))
    : `;

if (!source.includes("async function fetchFastRankingResults(")) {
  const start = source.indexOf("async function fetchConcoursFilteredResults(field, value)");
  const end = source.indexOf("async function searchConcoursByLocation", start);
  if (start >= 0 && end > start) {
    const concoursFunction = source.slice(start, end);
    const fastFunction = `${concoursFunction}
async function fetchFastRankingResults(source, field, value) {
  if (!source || !field || !value) return [];
  if (source === "concours") return fetchConcoursFilteredResults(field, value);

  const config = {
    bac: {
      table: BAC_TABLE,
      columns: { wl: "WL", moughataa: "MD", ms: "MS", track: "TS" },
      prepare: prepareStudents,
    },
    brevet: {
      table: BREVET_TABLE,
      columns: { wl: "WILAYA", ms: "Ecole", centre: "Centre" },
      prepare: prepareBrevetStudents,
    },
    bac_session: {
      table: BAC_SESSION_TABLE,
      columns: { wl: "Wilaya_AR", ms: "Etablissement_AR", centre: "Centre Examen_AR", track: "SERIE" },
      prepare: prepareBacSessionStudents,
    },
    excellence_1as: {
      table: EXCELLENCE_1AS_TABLE,
      columns: { wl: "Wilaya_AR", centre: "CENTRE_AR" },
      prepare: prepareExcellenceStudents,
    },
  }[source];

  const column = config?.columns?.[field];
  if (!config || !column) return [];

  const rows = [];
  let from = 0;
  while (true) {
    const batch = await supabaseRequest({
      select: "*",
      [column]: `eq.${escapePostgrestValue(value)}`,
      limit: PAGE_SIZE,
      offset: from,
    }, config.table);
    rows.push(...batch);
    if (batch.length < PAGE_SIZE) break;
    from += PAGE_SIZE;
  }

  return config.prepare(rows).sort((a, b) => getAverage(b) - getAverage(a) || a.originalIndex - b.originalIndex);
}
`;
    source = source.slice(0, start) + fastFunction + source.slice(end);
  }
}

if (!source.includes("const [rankingRows, setRankingRows] = useState([]);")) {
  source = source.replace(
    `  const [rankingTarget, setRankingTarget] = useState(null);`,
    `  const [rankingTarget, setRankingTarget] = useState(null);\n  const [rankingRows, setRankingRows] = useState([]);`
  );
}

const oldRankingMemo = `  const rankingStudents = useMemo(() => {
    if (!rankingTarget) return [];
    const target = normalizeComparable(rankingTarget.value);
    return activeStudents
      .filter((student) => normalizeComparable(student[rankingTarget.field]) === target)
      .sort((a, b) => getAverage(b) - getAverage(a) || a.originalIndex - b.originalIndex);
  }, [activeStudents, rankingTarget]);`;
const newRankingMemo = `  const rankingStudents = useMemo(() => {
    if (!rankingTarget) return [];
    if (rankingRows.length) return [...rankingRows].sort((a, b) => getAverage(b) - getAverage(a) || a.originalIndex - b.originalIndex);
    const target = normalizeComparable(rankingTarget.value);
    return activeStudents
      .filter((student) => normalizeComparable(student[rankingTarget.field]) === target)
      .sort((a, b) => getAverage(b) - getAverage(a) || a.originalIndex - b.originalIndex);
  }, [activeStudents, rankingRows, rankingTarget]);`;
if (source.includes(oldRankingMemo)) source = source.replace(oldRankingMemo, newRankingMemo);

for (const marker of [
  "setSelectedStudent(null);\n    setResultPageOpen(false);\n    setError(\"\");\n    setMessage(\"\");",
  "setSelectedStudent(null);\n    setResultPageOpen(false);\n    setError(\"\");\n    setMessage(\"\");\n    setAnalyticsMode(\"\");"
]) {
  if (source.includes(marker) && !source.includes(marker.replace('setMessage("");', 'setMessage("");\n    setRankingRows([]);'))) {
    source = source.replace(marker, marker.replace('setMessage("");', 'setMessage("");\n    setRankingRows([]);'));
  }
}

const oldOpenRanking = `  async function openRanking(field, value, label) {
    if (!value || value === "غير متوفرة") return;
    if (selectedExam?.source === "concours") {
      setExamLoading(true);
      try {
        const rows = await fetchConcoursFilteredResults(field, value);
        setConcoursStudents(rows);
      } catch (error) {
        setError(isMissingSupabaseEnv(error) ? text.missingEnv : text.connectionError);
      } finally {
        setExamLoading(false);
      }
    } else {
      await loadExamData(selectedExam);
    }
    setRankingTarget({ field, value, label });
    setActiveView("ranking");
    window.history.pushState({ view: "ranking" }, "", "#ranking");
    window.setTimeout(() => window.scrollTo({ top: 0, behavior: "smooth" }), 0);
  }`;
const newOpenRanking = `  async function openRanking(field, value, label) {
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
if (source.includes(oldOpenRanking)) source = source.replace(oldOpenRanking, newOpenRanking);

if (source !== original) {
  writeFileSync(file, source, "utf8");
  console.log("Fast ranking stage applied.");
} else {
  console.log("Fast ranking stage already applied or targets changed.");
}
