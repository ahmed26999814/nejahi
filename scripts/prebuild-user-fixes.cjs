const fs = require("fs");
const p = "app/page.jsx";
let s = fs.readFileSync(p, "utf8");

function replaceNamedFunction(name, next) {
  for (const marker of [`async function ${name}(`, `function ${name}(`]) {
    const start = s.indexOf(marker);
    if (start < 0) continue;
    const bodyStart = s.indexOf("{", start);
    if (bodyStart < 0) continue;
    let depth = 0;
    for (let i = bodyStart; i < s.length; i += 1) {
      if (s[i] === "{") depth += 1;
      if (s[i] === "}") depth -= 1;
      if (depth === 0) {
        s = s.slice(0, start) + next + s.slice(i + 1);
        return;
      }
    }
  }
  throw new Error("Function not found: " + name);
}

if (!s.includes("function normalizeCandidateNumber(")) {
  s = s.replace(
    "function prepareStudents(rows) {",
    `function normalizeCandidateNumber(value) {
  const raw = String(value ?? "").trim();
  const clean = raw.replace(/^0+/, "");
  return clean || raw;
}

function prepareStudents(rows) {`
  );
}

if (!s.includes("async function fetchFastRankingResults(")) {
  s = s.replace(
    "async function searchConcoursByLocation",
    `async function fetchFastRankingResults(source, field, value) {
  if (!source || !field || !value) return [];
  if (source === "concours") return fetchConcoursFilteredResults(field, value);

  const config = {
    bac: { table: BAC_TABLE, columns: { wl: "WL", moughataa: "MD", ms: "MS", track: "TS" }, prepare: prepareStudents },
    brevet: { table: BREVET_TABLE, columns: { wl: "WILAYA", ms: "Ecole", centre: "Centre" }, prepare: prepareBrevetStudents },
    bac_session: { table: BAC_SESSION_TABLE, columns: { wl: "Wilaya_AR", ms: "Etablissement_AR", centre: "Centre Examen_AR", track: "SERIE" }, prepare: prepareBacSessionStudents },
    excellence_1as: { table: EXCELLENCE_1AS_TABLE, columns: { wl: "Wilaya_AR", centre: "CENTRE_AR" }, prepare: prepareExcellenceStudents },
  }[source];

  const column = config?.columns?.[field];
  if (!config || !column) return [];

  const rows = [];
  let from = 0;
  while (true) {
    const batch = await supabaseRequest({
      select: "*",
      [column]: "eq." + escapePostgrestValue(value),
      limit: PAGE_SIZE,
      offset: from,
    }, config.table);
    rows.push(...batch);
    if (batch.length < PAGE_SIZE) break;
    from += PAGE_SIZE;
  }
  return config.prepare(rows).sort((a, b) => getAverage(b) - getAverage(a) || a.originalIndex - b.originalIndex);
}

async function searchConcoursByLocation`
  );
}

s = s.replace(
  /const \[rankingTarget, setRankingTarget\] = useState\(null\);\s*(?:\n\s*const \[rankingRows, setRankingRows\] = useState\(\[\]\);)?/,
  `const [rankingTarget, setRankingTarget] = useState(null);
  const [rankingRows, setRankingRows] = useState([]);`
);

s = s.replace(
`  const rankingStudents = useMemo(() => {
    if (!rankingTarget) return [];
    const target = normalizeComparable(rankingTarget.value);
    return activeStudents
      .filter((student) => normalizeComparable(student[rankingTarget.field]) === target)
      .sort((a, b) => getAverage(b) - getAverage(a) || a.originalIndex - b.originalIndex);
  }, [activeStudents, rankingTarget]);`,
`  const rankingStudents = useMemo(() => {
    if (!rankingTarget) return [];
    if (rankingRows.length) return [...rankingRows].sort((a, b) => getAverage(b) - getAverage(a) || a.originalIndex - b.originalIndex);
    const target = normalizeComparable(rankingTarget.value);
    return activeStudents
      .filter((student) => normalizeComparable(student[rankingTarget.field]) === target)
      .sort((a, b) => getAverage(b) - getAverage(a) || a.originalIndex - b.originalIndex);
  }, [activeStudents, rankingRows, rankingTarget]);`
);

s = s.replace(
`      const rows = await searchResults(value, selectedExam);
      const found = rows.map((student) => {
        const known = searchPool.find((item) => item.id === student.id);
        return known ? { ...student, rank: known.rank } : student;
      }).filter((student) => selectedExam?.filter === "sessionnaire" ? getOfficialStatus(student.kr).className === "sessionnaire" : true);`,
`      const rankingPool = selectedExam?.source === "bac" ? await loadExamData(selectedExam) : searchPool;
      const rows = await searchResults(value, selectedExam);
      const found = rows.map((student) => {
        const known = rankingPool.find((item) => normalizeCandidateNumber(item.id) === normalizeCandidateNumber(student.id));
        return known ? { ...student, rank: known.rank } : student;
      }).filter((student) => selectedExam?.filter === "sessionnaire" ? getOfficialStatus(student.kr).className === "sessionnaire" : true);`
);

replaceNamedFunction("openRanking", `  async function openRanking(field, value, label) {
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
  }`);

replaceNamedFunction("RankingPage", `function RankingPage({ onSelect, rankingTarget, students, text }) {
  const orderedStudents = useMemo(() => [...students].sort((a, b) => getAverage(b) - getAverage(a) || a.originalIndex - b.originalIndex), [students]);
  return (
    <section className="app-shell grid gap-4 py-4 md:gap-6 md:py-8">
      <PageHero eyebrow={text.ranking} title={rankingTarget.value} description={text.rankingDesc} icon={rankingTarget.field === "ms" ? <SchoolIcon /> : <MapIcon />} />
      <section className="analytics-panel animate-slide-up">
        <div className="mb-3 flex items-center justify-between gap-2">
          <h2 className="text-base font-black text-slate-950 dark:text-white">{rankingTarget.label}</h2>
          <span className="rounded-full bg-mauri-green/10 px-2.5 py-1 text-[11px] font-black text-mauri-green dark:text-emerald-300">{orderedStudents.length.toLocaleString("ar-MR")}</span>
        </div>
        <div className="grid gap-2">
          {orderedStudents.length ? orderedStudents.slice(0, 200).map((student, index) => (
            <button className="ranking-row" key={student.id} onClick={() => onSelect(student)} type="button">
              <span className="grid h-9 w-9 place-items-center rounded-[14px] bg-mauri-green/10 text-sm font-black text-mauri-green dark:bg-emerald-300/10 dark:text-emerald-300">#{index + 1}</span>
              <span className="min-w-0 text-start">
                <strong className="line-clamp-1 block text-sm font-black text-slate-950 dark:text-white">{student.name}</strong>
                <small className="line-clamp-1 text-xs font-bold text-slate-500 dark:text-slate-400">{student.id} - {student.ms || student.moughataa || text.unavailable}</small>
              </span>
              <strong className="text-lg font-black text-mauri-green dark:text-mauri-gold">{formatScore(student, text)}</strong>
            </button>
          )) : <p className="rounded-[18px] border border-mauri-border bg-white p-4 text-sm font-bold text-slate-500 dark:border-white/10 dark:bg-white/10 dark:text-slate-400">{text.noData}</p>}
        </div>
      </section>
    </section>
  );
}`);

s = s.replace(
  `[text.moughataa, student.moughataa || text.unavailable, <MapIcon key="moughataa" />],`,
  `[text.moughataa, student.moughataa || text.unavailable, <MapIcon key="moughataa" />, () => onOpenRanking?.("moughataa", student.moughataa, text.moughataa)],`
);

s = s.replace(/\n\s*<ResultOfficialSummary[\s\S]*?\n\s*\/>
\s*<ResultCard/, "\n        <ResultCard");

s = s.replace(
  "function HomeView({ homepageBanner, lang, onSelectYear, stats, text })",
  "function HomeView({ content, homepageBanner, lang, onSelectYear, stats, text })"
);
s = s.replace("<PremiumHomeView\n      homepageBanner={homepageBanner}", "<PremiumHomeView\n      content={content}\n      homepageBanner={homepageBanner}");

fs.writeFileSync(p, s, "utf8");
console.log("Applied MauriResults user-requested fixes");
