require("./prebuild-user-fixes-v12.cjs");

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

// Make 2026 year open automatically when any published uploaded exam belongs to 2026.
s = s.replace(
  `    const has2026 = publishedExams.some((exam) => String(exam.year || "") === "2026");`,
  `    const has2026 = publishedExams.some((exam) => {
      const text = [exam.year, exam.id, exam.source, exam.title?.ar, exam.title?.fr, exam.tableName].filter(Boolean).join(" ");
      return /2026/.test(String(text));
    });`
);

// Pass the real dynamic yearCards into the premium home. The previous fallback forced YEAR_CARDS and kept 2026 locked.
s = s.replace(
  `function HomeView({ content, homepageBanner, lang, onSelectYear, stats, text }) {`,
  `function HomeView({ content, homepageBanner, lang, onSelectYear, stats, text, yearCards = YEAR_CARDS }) {`
);
s = s.replace(
  `function HomeView({ content, homepageBanner, lang, onSelectYear, stats, text, yearCards = YEAR_CARDS }) {`,
  `function HomeView({ content, homepageBanner, lang, onSelectYear, stats, text, yearCards = YEAR_CARDS }) {`
);
s = s.replace(/yearCards=\{typeof yearCards !== "undefined" \? yearCards : YEAR_CARDS\}/g, `yearCards={yearCards}`);

// Restore a big, colored official decision badge directly below the average, as before.
const averageBlock = `              <strong className="mt-3 inline-flex rounded-[18px] bg-mauri-green/10 px-4 py-2 text-3xl font-black text-mauri-green dark:bg-mauri-gold/10 dark:text-mauri-gold">
                {isConcours ? \`\${average.toFixed(2)} / 200\` : average.toFixed(2)}
              </strong>`;
const decisionBadge = `${averageBlock}
              {!isConcours && (
                <span className={\`status-badge \${status.className} mt-3 rounded-[18px] px-5 py-2 text-base font-black shadow-soft md:text-lg\`}>
                  {status.label}
                </span>
              )}`;
if (s.includes(averageBlock) && !s.includes("status.className} mt-3 rounded-[18px] px-5 py-2")) {
  s = s.replace(averageBlock, decisionBadge);
}

fs.writeFileSync(p, s, "utf8");
console.log("Applied MauriResults big decision badge and dynamic years v13");
