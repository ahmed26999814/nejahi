require("./prebuild-user-fixes-v9.cjs");

const fs = require("fs");
const p = "app/page.jsx";
let s = fs.readFileSync(p, "utf8");

function replaceOnce(search, replacement) {
  if (s.includes(search)) s = s.replace(search, replacement);
}

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

function replaceFunction(name, body) {
  const b = findFunctionBounds(name);
  s = s.slice(0, b.start) + body + s.slice(b.end);
}

// Published exams analytics: make uploaded results appear in الإحصائيات and الأوائل.
replaceOnce(
  `async function fetchAnalyticsViewSet(source) {
  const views = ANALYTICS_VIEW_NAMES[source];`,
  `async function fetchAnalyticsViewSet(source) {
  if (String(source || "").startsWith("upload:")) {
    try {
      const response = await fetch(\`/api/published-exam-analytics?source=\${encodeURIComponent(source)}\`, { headers: { Accept: "application/json" } });
      if (!response.ok) throw new Error(await response.text());
      return await response.json();
    } catch (error) {
      console.warn("[MauriResults Published Analytics]", error);
      return null;
    }
  }
  const views = ANALYTICS_VIEW_NAMES[source];`
);

// Remember which year page is open and enable 2026 when published exams exist.
replaceOnce(
  `  const [selectedExamId, setSelectedExamId] = useState(() => getInitialRouteState().examId);`,
  `  const [selectedExamId, setSelectedExamId] = useState(() => getInitialRouteState().examId);
  const [selectedYearId, setSelectedYearId] = useState(() => typeof window !== "undefined" && window.location.hash.replace("#", "") === "year-2026" ? "year-2026" : "year-2025");`
);
replaceOnce(
  `  const examCards = useMemo(() => [...EXAM_CARDS, ...publishedExams], [publishedExams]);
  const selectedExam = useMemo(() => examCards.find((exam) => exam.id === selectedExamId), [examCards, selectedExamId]);`,
  `  const examCards = useMemo(() => [...EXAM_CARDS, ...publishedExams], [publishedExams]);
  const yearCards = useMemo(() => YEAR_CARDS.map((year) => {
    if (year.id !== "year-2026") return year;
    const has2026 = publishedExams.some((exam) => String(exam.year || "") === "2026");
    return has2026 ? {
      ...year,
      available: true,
      title: { ar: "نتائج المسابقات 2026", fr: "Résultats des concours 2026" },
      description: { ar: "نتائج 2026 المنشورة من لوحة الأدمن.", fr: "Résultats 2026 publiés depuis l'administration." },
    } : year;
  }), [publishedExams]);
  const selectedExam = useMemo(() => examCards.find((exam) => exam.id === selectedExamId), [examCards, selectedExamId]);`
);

replaceOnce(
  `function HomeView({ homepageBanner, lang, onSelectYear, stats, text }) {`,
  `function HomeView({ homepageBanner, lang, onSelectYear, stats, text, yearCards = YEAR_CARDS }) {`
);
replaceOnce(`      yearCards={YEAR_CARDS}`, `      yearCards={yearCards}`);
replaceOnce(
  `          text={text}
        />`,
  `          text={text}
          yearCards={yearCards}
        />`
);

// Open the correct year hash instead of always year-2025.
replaceFunction("openYear", `function openYear(year) {
    if (!year.available) return;
    setSelectedYearId(year.id || "year-2025");
    setActiveView("year");
    setMatches([]);
    setError("");
    setMessage("");
    window.history.pushState({ view: "year" }, "", \`#\${year.id || "year-2025"}\`);
    window.setTimeout(() => window.scrollTo({ top: 0, behavior: "smooth" }), 0);
  }`);

// Keep exam selection tied to its year.
replaceOnce(
  `    setSelectedExamId(exam.id);
    setSelectedTopperTrack("");`,
  `    setSelectedExamId(exam.id);
    if (exam.year) setSelectedYearId(\`year-\${exam.year}\`);
    setSelectedTopperTrack("");`
);

// Use dynamic cards and filter them by year.
s = s.replace(
  `{activeView === "year" && <YearPage examCards={examCards} lang={lang} onSelectExam={openExam} selectedExamId={selectedExamId} text={text} />}`,
  `{activeView === "year" && <YearPage currentYearId={selectedYearId} examCards={examCards} lang={lang} onSelectExam={openExam} selectedExamId={selectedExamId} text={text} />}`
);
s = s.replace(
  `function YearPage({ examCards = EXAM_CARDS, lang, onSelectExam, selectedExamId, text }) {`,
  `function YearPage({ currentYearId = "year-2025", examCards = EXAM_CARDS, lang, onSelectExam, selectedExamId, text }) {`
);
s = s.replace(
  `<CompetitionCards examCards={examCards} lang={lang} onSelectExam={onSelectExam} selectedExamId={selectedExamId} text={text} />`,
  `<CompetitionCards currentYearId={currentYearId} examCards={examCards} lang={lang} onSelectExam={onSelectExam} selectedExamId={selectedExamId} text={text} />`
);
s = s.replace(
  `function CompetitionCards({ examCards = EXAM_CARDS, lang, onSelectExam, selectedExamId, text }) {`,
  `function CompetitionCards({ currentYearId = "year-2025", examCards = EXAM_CARDS, lang, onSelectExam, selectedExamId, text }) {
  const visibleExamCards = examCards.filter((exam) => {
    const year = String(exam.year || "2025");
    return currentYearId === "year-2026" ? year === "2026" : year !== "2026";
  });`
);
s = s.replace(`{examCards.map((exam) => (`, `{visibleExamCards.map((exam) => (`);

// Selectors on analytics/toppers should include uploaded exams too.
s = s.replace(
  `{activeView === "toppers" && <ToppersPage groups={topperGroups} lang={lang} loading={selectedSourceLoading} onSelect={selectStudent} onSelectExam={selectExamForSection} onSelectTrack={setSelectedTopperTrack} selectedExam={selectedExam} selectedExamId={selectedExamId} selectedTrack={selectedTopperTrack} showTrackGroups={showTrackGroups} showTrackSelector={showTopperTrackSelector} text={text} trackOptions={topperTrackOptions} />}`,
  `{activeView === "toppers" && <ToppersPage examCards={examCards} groups={topperGroups} lang={lang} loading={selectedSourceLoading} onSelect={selectStudent} onSelectExam={selectExamForSection} onSelectTrack={setSelectedTopperTrack} selectedExam={selectedExam} selectedExamId={selectedExamId} selectedTrack={selectedTopperTrack} showTrackGroups={showTrackGroups} showTrackSelector={showTopperTrackSelector} text={text} trackOptions={topperTrackOptions} />}`
);
s = s.replace(
  `{activeView === "analytics" && <AnalyticsPage analyticsMode={activeAnalyticsMode} analyticsOptions={analyticsOptions} components={{ PageHero, ExamSelector, StatsStrip, AnalyticsModeSelector, StatsTable, EmptyChoice, ChartIcon }} lang={lang} loading={selectedSourceLoading} onSelectAnalyticsMode={setAnalyticsMode} onSelectExam={selectExamForSection} rows={selectedAnalyticsRows} selectedExam={selectedExam} selectedExamId={selectedExamId} stats={activeStats} tableIcon={selectedAnalyticsIcon} tableTitle={selectedAnalyticsTitle} text={text} />}`,
  `{activeView === "analytics" && <AnalyticsPage analyticsMode={activeAnalyticsMode} analyticsOptions={analyticsOptions} components={{ PageHero, ExamSelector, StatsStrip, AnalyticsModeSelector, StatsTable, EmptyChoice, ChartIcon }} examCards={examCards} lang={lang} loading={selectedSourceLoading} onSelectAnalyticsMode={setAnalyticsMode} onSelectExam={selectExamForSection} rows={selectedAnalyticsRows} selectedExam={selectedExam} selectedExamId={selectedExamId} stats={activeStats} tableIcon={selectedAnalyticsIcon} tableTitle={selectedAnalyticsTitle} text={text} />}`
);

// ToppersPage and AnalyticsPage pass examCards to ExamSelector.
s = s.replace(
  `<ExamSelector lang={lang} onSelectExam={onSelectExam} selectedExamId={selectedExamId} text={text} />`,
  `<ExamSelector examCards={examCards} lang={lang} onSelectExam={onSelectExam} selectedExamId={selectedExamId} text={text} />`
);
s = s.replace(
  `export default function AnalyticsPage(props) {`,
  `export default function AnalyticsPage(props) {`
);

// Use dynamic cards when selecting from analytics/toppers.
s = s.replace(`const exam = examCards.find((item) => item.id === examId);`, `const exam = examCards.find((item) => item.id === examId);`);

fs.writeFileSync(p, s, "utf8");
console.log("Applied MauriResults year-separated published exams and analytics v10");
