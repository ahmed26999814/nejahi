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
    const ch = source[i];
    if (ch === "{") depth += 1;
    if (ch === "}") depth -= 1;
    if (depth === 0) {
      source = source.slice(0, start) + next + source.slice(i + 1);
      return true;
    }
  }
  return false;
}

source = source.replace(
  "function HomeView({ homepageBanner, lang, onSelectYear, stats, text })",
  "function HomeView({ content, homepageBanner, lang, onSelectYear, stats, text })"
);
source = source.replace(
  `<PremiumHomeView\n      homepageBanner={homepageBanner}`,
  `<PremiumHomeView\n      content={content}\n      homepageBanner={homepageBanner}`
);

const oldSearchRank = `const rows = await searchResults(value, selectedExam);
      const found = rows.map((student) => {
        const known = searchPool.find((item) => item.id === student.id);
        return known ? { ...student, rank: known.rank } : student;
      }).filter((student) => selectedExam?.filter === "sessionnaire" ? getOfficialStatus(student.kr).className === "sessionnaire" : true);`;
const newSearchRank = `const rankingPool = selectedExam?.source === "bac" ? await loadExamData(selectedExam) : searchPool;
      const rows = await searchResults(value, selectedExam);
      const found = rows.map((student) => {
        const known = rankingPool.find((item) => normalizeCandidateNumber(item.id) === normalizeCandidateNumber(student.id));
        return known ? { ...student, rank: known.rank } : student;
      }).filter((student) => selectedExam?.filter === "sessionnaire" ? getOfficialStatus(student.kr).className === "sessionnaire" : true);`;
if (source.includes(oldSearchRank)) source = source.replace(oldSearchRank, newSearchRank);

source = source.replace(
  `[text.moughataa, student.moughataa || text.unavailable, <MapIcon key="moughataa" />],`,
  `[text.moughataa, student.moughataa || text.unavailable, <MapIcon key="moughataa" />, () => onOpenRanking?.("moughataa", student.moughataa, text.moughataa)],`
);

const resultCardMarker = "function ResultCard(";
const resultCardIndex = source.indexOf(resultCardMarker);
const resultHeaderStart = resultCardIndex >= 0 ? source.indexOf('      <div className="result-modal-header">', resultCardIndex) : -1;
const detailsGridStart = resultHeaderStart >= 0 ? source.indexOf('\n\n      <div className="mt-4 grid grid-cols-2 gap-2">', resultHeaderStart) : -1;
if (resultHeaderStart >= 0 && detailsGridStart > resultHeaderStart) {
  const newResultHeader = `      <div className="result-modal-header">
        <div className="min-w-0 flex-1">
          <p className="text-[11px] font-black text-mauri-green dark:text-mauri-gold">{text.resultCard}</p>
          <h2 className="mt-1 text-lg font-black text-slate-950 dark:text-white">تفاصيل النتيجة</h2>
        </div>
      </div>`;
  source = source.slice(0, resultHeaderStart) + newResultHeader + source.slice(detailsGridStart);
}

const nextResultCardIndex = source.indexOf(resultCardMarker);
const resultUseEffect = nextResultCardIndex >= 0 ? source.indexOf("\n\n  useEffect(() => {", nextResultCardIndex) : -1;
if (!source.includes("const compactDetails = details.filter") && resultUseEffect > nextResultCardIndex) {
  const compactCode = `\n\n  const compactDetails = details.filter(([label]) => label !== text.id && label !== (text.exam || "المسابقة"));`;
  source = source.slice(0, resultUseEffect) + compactCode + source.slice(resultUseEffect);
}
source = source.replace("{details.map(([label, value, icon, onClick]) => (", "{compactDetails.map(([label, value, icon, onClick]) => (");
source = source.replace("<ResultDetailsGrid details={details} />", "<ResultDetailsGrid details={compactDetails} />");

const rankingPage = `function RankingPage({ onSelect, rankingTarget, students, text }) {
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
}`;
replaceFunction("RankingPage", rankingPage);

if (source !== original) {
  writeFileSync(file, source, "utf8");
  console.log("User requested cleanup applied.");
} else {
  console.log("No user cleanup changes needed.");
}
