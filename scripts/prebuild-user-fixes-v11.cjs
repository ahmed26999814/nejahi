require("./prebuild-user-fixes-v10.cjs");

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
  return null;
}

function replaceFunction(name, next) {
  const bounds = findFunctionBounds(name);
  if (bounds) s = s.slice(0, bounds.start) + next + s.slice(bounds.end);
}

// Normalize accidental same-line state declarations left by older prebuild layers.
s = s.replace(/;\s*const \[rankingRows, setRankingRows\]/g, ";\n  const [rankingRows, setRankingRows]");
s = s.replace(/;\s*const \[analyticsViews, setAnalyticsViews\]/g, ";\n  const [analyticsViews, setAnalyticsViews]");
s = s.replace(/;\s*const \[analyticsLoadingSources, setAnalyticsLoadingSources\]/g, ";\n  const [analyticsLoadingSources, setAnalyticsLoadingSources]");
s = s.replace(/;\s*const \[publishedExams, setPublishedExams\]/g, ";\n  const [publishedExams, setPublishedExams]");
s = s.replace(/;\s*const \[selectedYearId, setSelectedYearId\]/g, ";\n  const [selectedYearId, setSelectedYearId]");

function collapseDuplicateState(name) {
  let seen = false;
  s = s.split("\n").filter((line) => {
    if (!line.includes(`const [${name},`)) return true;
    if (seen) return false;
    seen = true;
    return true;
  }).join("\n");
}

collapseDuplicateState("rankingRows");
collapseDuplicateState("analyticsViews");
collapseDuplicateState("analyticsLoadingSources");
collapseDuplicateState("publishedExams");
collapseDuplicateState("selectedYearId");

// Strong route parser: refresh on #year-2025 stays on the 2025 competitions page.
replaceFunction("getInitialRouteState", `function getInitialRouteState() {
  if (typeof window === "undefined") return { view: "home", examId: "", yearId: "year-2025" };
  const hash = window.location.hash.replace("#", "").trim();
  const savedExamId = localStorage.getItem("mauriresults-selected-exam") || "";
  const yearHash = hash.match(/^year-(20\\d{2})$/)?.[0];
  const knownExam = EXAM_CARDS.find((exam) => exam.id === hash && exam.available);

  if (hash === "year" || yearHash) return { view: "year", examId: "", yearId: yearHash || "year-2025" };
  if (knownExam || hash.startsWith("upload-")) return { view: "exam", examId: hash, yearId: hash.includes("2026") ? "year-2026" : "year-2025" };
  if (["analytics", "toppers", "contact"].includes(hash)) return { view: hash, examId: savedExamId, yearId: "year-2025" };
  return { view: "home", examId: savedExamId, yearId: "year-2025" };
}`);

// Make selectedYearId initialize from the hash route, not always 2025/2026 ad hoc.
s = s.replace(
  `  const [selectedYearId, setSelectedYearId] = useState(() => typeof window !== "undefined" && window.location.hash.replace("#", "") === "year-2026" ? "year-2026" : "year-2025");`,
  `  const [selectedYearId, setSelectedYearId] = useState(() => getInitialRouteState().yearId || "year-2025");`
);

// Make the home 2025 year card clickable by passing the real yearCards prop into PremiumHomeView.
s = s.replace(
  `function HomeView({ content, homepageBanner, lang, onSelectYear, stats, text }) {`,
  `function HomeView({ content, homepageBanner, lang, onSelectYear, stats, text, yearCards = YEAR_CARDS }) {`
);
s = s.replace(
  `function HomeView({ homepageBanner, lang, onSelectYear, stats, text, yearCards = YEAR_CARDS }) {`,
  `function HomeView({ homepageBanner, lang, onSelectYear, stats, text, yearCards = YEAR_CARDS }) {`
);
s = s.replace(/yearCards=\{typeof yearCards !== "undefined" \? yearCards : YEAR_CARDS\}/g, `yearCards={yearCards}`);
if (s.includes(`          suggestions={suggestions}\n          text={text}`) && !s.includes(`          yearCards={yearCards}\n          text={text}`)) {
  s = s.replace(`          suggestions={suggestions}\n          text={text}`, `          suggestions={suggestions}\n          yearCards={yearCards}\n          text={text}`);
}

// Robust year navigation. Accept both "2025" and "year-2025", clear stale selected exam, and open the correct year page.
replaceFunction("openYear", `function openYear(year) {
    const rawYearId = String(year?.id || "year-2025");
    const yearId = rawYearId.startsWith("year-") ? rawYearId : \`year-\${rawYearId}\`;
    if (year?.available === false) return;
    setSelectedYearId(yearId);
    setSelectedExamId("");
    setSelectedTopperTrack("");
    setActiveView("year");
    setMatches([]);
    setError("");
    setMessage("");
    window.history.pushState({ view: "year", yearId }, "", \`#\${yearId}\`);
    window.setTimeout(() => window.scrollTo({ top: 0, behavior: "smooth" }), 0);
  }`);

// Hash-sync effect fixes refresh and direct links for #year-2025, #year-2026, #analytics, etc.
if (!s.includes("MauriResults Route Sync v12")) {
  s = s.replace(
    `  function setTheme(nextTheme) {`,
    `  useEffect(() => {
    function syncRouteFromHash() {
      const route = getInitialRouteState();
      if (route.yearId) setSelectedYearId(route.yearId);
      if (route.view === "year") {
        setSelectedExamId("");
        setActiveView("year");
        setResultPageOpen(false);
        setSelectedStudent(null);
      } else if (route.view === "exam") {
        setSelectedExamId(route.examId);
        setActiveView("exam");
        setResultPageOpen(false);
        setSelectedStudent(null);
      } else if (["analytics", "toppers", "contact", "home"].includes(route.view)) {
        setActiveView(route.view);
        if (route.examId) setSelectedExamId(route.examId);
        setResultPageOpen(false);
        setSelectedStudent(null);
      }
    }
    syncRouteFromHash();
    window.addEventListener("hashchange", syncRouteFromHash);
    window.addEventListener("popstate", syncRouteFromHash);
    return () => {
      window.removeEventListener("hashchange", syncRouteFromHash);
      window.removeEventListener("popstate", syncRouteFromHash);
    };
  }, []); // MauriResults Route Sync v12

  function setTheme(nextTheme) {`
  );
}

// Separate 2026 uploaded exams from 2025. Never let "نتائج باكالوريا 2026" appear inside the 2025 page.
if (!s.includes("function getExamCardYear(exam)")) {
  s = s.replace(
    `function CompetitionCards({ currentYearId = "year-2025", examCards = EXAM_CARDS, lang, onSelectExam, selectedExamId, text }) {`,
    `function getExamCardYear(exam) {
  const searchText = [exam?.id, exam?.title?.ar, exam?.title?.fr, exam?.sessionType, exam?.tableName, exam?.source].filter(Boolean).join(" ");
  const fromText = String(searchText).match(/20\\d{2}/)?.[0];
  if (fromText) return fromText;
  return String(exam?.year || "").match(/20\\d{2}/)?.[0] || "2025";
}

function CompetitionCards({ currentYearId = "year-2025", examCards = EXAM_CARDS, lang, onSelectExam, selectedExamId, text }) {`
  );
} else {
  replaceFunction("getExamCardYear", `function getExamCardYear(exam) {
  const searchText = [exam?.id, exam?.title?.ar, exam?.title?.fr, exam?.sessionType, exam?.tableName, exam?.source].filter(Boolean).join(" ");
  const fromText = String(searchText).match(/20\\d{2}/)?.[0];
  if (fromText) return fromText;
  return String(exam?.year || "").match(/20\\d{2}/)?.[0] || "2025";
}`);
}
s = s.replace(
  `  const visibleExamCards = examCards.filter((exam) => {
    const year = String(exam.year || "2025");
    return currentYearId === "year-2026" ? year === "2026" : year !== "2026";
  });`,
  `  const currentYear = String(currentYearId || "year-2025").replace("year-", "");
  const visibleExamCards = examCards.filter((exam) => getExamCardYear(exam) === currentYear);`
);

fs.writeFileSync(p, s, "utf8");
console.log("Applied MauriResults final prebuild cleanup v11");
