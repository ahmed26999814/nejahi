require("./prebuild-user-fixes-v15.cjs");

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

// Keep selected year when clicking 2025/2026 cards.
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

// Build the page title and cards from the selected year, not the old static text.
replaceFunction("YearPage", `function YearPage({ currentYearId = "year-2025", examCards = EXAM_CARDS, lang, onSelectExam, selectedExamId, text }) {
  const yearValue = String(currentYearId || "year-2025").replace("year-", "") || "2025";
  const title = lang === "fr" ? \`Concours \${yearValue}\` : \`مسابقات \${yearValue}\`;
  const description = yearValue === "2026"
    ? (lang === "fr" ? "Choisissez un résultat 2026 publié depuis l'administration." : "اختر نتيجة 2026 المنشورة من لوحة الأدمن.")
    : text.yearPageDesc;
  return (
    <section className="app-shell grid gap-4 py-4 md:gap-6 md:py-8">
      <PageHero eyebrow={text.chooseExam} title={title} description={description} icon={<GraduationIcon />} />
      <CompetitionCards currentYearId={currentYearId} examCards={examCards} lang={lang} onSelectExam={onSelectExam} selectedExamId={selectedExamId} text={text} />
    </section>
  );
}`);

replaceFunction("getExamCardYear", `function getExamCardYear(exam) {
  const explicit = String(exam?.year || "").match(/20\\d{2}/)?.[0];
  if (explicit) return explicit;
  const searchText = [exam?.id, exam?.title?.ar, exam?.title?.fr, exam?.sessionType, exam?.tableName, exam?.source].filter(Boolean).join(" ");
  return String(searchText).match(/20\\d{2}/)?.[0] || "2025";
}`);

replaceFunction("CompetitionCards", `function CompetitionCards({ currentYearId = "year-2025", examCards = EXAM_CARDS, lang, onSelectExam, selectedExamId, text }) {
  const currentYear = String(currentYearId || "year-2025").replace("year-", "") || "2025";
  const visibleExamCards = examCards.filter((exam) => getExamCardYear(exam) === currentYear);
  const cardsToRender = currentYear === "2026" && !visibleExamCards.length
    ? examCards.filter((exam) => String(exam.source || "").startsWith("upload:"))
    : visibleExamCards;
  return (
    <section className="grid grid-cols-2 gap-3">
      {cardsToRender.map((exam) => (
        <button
          className={\`exam-card exam-card-\${exam.tone} \${selectedExamId === exam.id ? "is-selected" : ""} \${exam.available ? "" : "is-locked"}\`}
          key={exam.id}
          onClick={() => exam.available && onSelectExam(exam)}
          type="button"
          disabled={!exam.available}
        >
          <span className="exam-card-icon">{exam.icon}</span>
          <span className="min-w-0 text-start">
            <strong className="block text-base font-black text-slate-950 dark:text-white">{exam.title[lang] || exam.title.ar}</strong>
            <small className="mt-1 block text-xs font-bold leading-5 text-slate-500 dark:text-slate-400">{exam.description[lang] || exam.description.ar}</small>
          </span>
          {!exam.available && <span className="soon-badge">{text.soon}</span>}
        </button>
      ))}
    </section>
  );
}`);

// Better light/dark decision colors.
s = s.replace(
  /  const decisionStyle = status\.className === "admis"[\s\S]*?: "border-white\/20 bg-white\/10 text-white ring-white\/10";/,
  `  const decisionStyle = status.className === "admis"
    ? "border-emerald-500/30 bg-emerald-50 text-emerald-700 ring-emerald-500/10 dark:border-emerald-400/40 dark:bg-emerald-500/15 dark:text-emerald-100 dark:ring-emerald-400/20"
    : status.className === "sessionnaire"
      ? "border-amber-500/30 bg-amber-50 text-amber-700 ring-amber-500/10 dark:border-amber-300/50 dark:bg-amber-400/15 dark:text-amber-100 dark:ring-amber-300/20"
      : status.className === "ajourne"
        ? "border-red-500/30 bg-red-50 text-red-700 ring-red-500/10 dark:border-red-300/50 dark:bg-red-500/15 dark:text-red-100 dark:ring-red-300/20"
        : status.className === "absent"
          ? "border-slate-400/30 bg-slate-100 text-slate-700 ring-slate-400/10 dark:border-slate-300/40 dark:bg-slate-400/15 dark:text-slate-100 dark:ring-slate-300/20"
          : "border-slate-300/40 bg-slate-50 text-slate-700 ring-slate-300/10 dark:border-white/20 dark:bg-white/10 dark:text-white dark:ring-white/10";`
);

// Remove all previous tiny or side-by-side decision badges.
s = s.replace(/\n\s*\{!isConcours && \(\n\s*<span className=\{`mauri-decision-badge[\s\S]*?<\/span>\n\s*\)\}/g, "");
s = s.replace(/\n\s*\{!isConcours && \(\n\s*<div className=\{`mauri-decision-strip[\s\S]*?<\/div>\n\s*\)\}/g, "");

const averageStrongRegex = /<strong className="mt-3 inline-flex rounded-\[18px\] bg-mauri-green\/10 px-4 py-2 text-3xl font-black text-mauri-green dark:bg-mauri-gold\/10 dark:text-mauri-gold">\s*\n\s*\{isConcours \? `\$\{average\.toFixed\(2\)\} \/ 200` : average\.toFixed\(2\)\}\s*\n\s*<\/strong>/;
if (averageStrongRegex.test(s)) {
  s = s.replace(averageStrongRegex, `<div className="mt-3 grid gap-2">
              <strong className="w-fit rounded-[18px] bg-mauri-green/10 px-4 py-2 text-3xl font-black text-mauri-green dark:bg-mauri-gold/10 dark:text-mauri-gold">
                {isConcours ? \`\${average.toFixed(2)} / 200\` : average.toFixed(2)}
              </strong>
              {!isConcours && (
                <div className={\`mauri-decision-strip flex w-full items-center justify-between gap-3 rounded-[22px] border px-4 py-3 text-sm font-black shadow-soft ring-1 md:text-base \${decisionStyle}\`}>
                  <span className="rounded-full bg-white/55 px-3 py-1 text-xs font-black opacity-90 dark:bg-white/15">{text.decision || "القرار"}</span>
                  <strong className="text-xl md:text-2xl">{status.label}</strong>
                </div>
              )}
            </div>`);
}

fs.writeFileSync(p, s, "utf8");
console.log("Applied MauriResults 2026 year page and decision strip layout v16");
