require("./prebuild-user-fixes-v13.cjs");

const fs = require("fs");
const p = "app/page.jsx";
let s = fs.readFileSync(p, "utf8");

// v10/v11 could leave the YEAR_CARDS useMemo without assigning it to yearCards.
// Without this variable, HomeView falls back to the locked static YEAR_CARDS.
s = s.replace(
  /(\n\s*)useMemo\(\(\) => YEAR_CARDS\.map\(\(year\) => \{/,
  "$1const yearCards = useMemo(() => YEAR_CARDS.map((year) => {"
);

// Pass the computed yearCards to HomeView so 2026 opens when published exams exist.
if (s.includes("          stats={homeStats}\n          suggestions={suggestions}") && !s.includes("          yearCards={yearCards}\n          suggestions={suggestions}")) {
  s = s.replace(
    "          stats={homeStats}\n          suggestions={suggestions}",
    "          stats={homeStats}\n          yearCards={yearCards}\n          suggestions={suggestions}"
  );
}

// Make HomeView accept yearCards in both old/new signatures.
s = s.replace(
  /function HomeView\(\{ content, homepageBanner, lang, onSelectYear, stats, text \}\) \{/g,
  "function HomeView({ content, homepageBanner, lang, onSelectYear, stats, text, yearCards = YEAR_CARDS }) {"
);
s = s.replace(/yearCards=\{typeof yearCards !== "undefined" \? yearCards : YEAR_CARDS\}/g, "yearCards={yearCards}");

// Restore a large colored decision badge below the average.
if (!s.includes("mauri-decision-badge")) {
  s = s.replace(
    /(<strong className="mt-3 inline-flex rounded-\[18px\] bg-mauri-green\/10 px-4 py-2 text-3xl font-black text-mauri-green dark:bg-mauri-gold\/10 dark:text-mauri-gold">\s*\n\s*\{isConcours \? `\$\{average\.toFixed\(2\)\} \/ 200` : average\.toFixed\(2\)\}\s*\n\s*<\/strong>)/,
    `$1
              {!isConcours && (
                <span className={\`mauri-decision-badge status-badge \${status.className} mt-3 rounded-[18px] px-5 py-2 text-base font-black shadow-soft md:text-lg\`}>
                  {status.label}
                </span>
              )}`
  );
}

fs.writeFileSync(p, s, "utf8");
console.log("Applied MauriResults dynamic year cards and big decision badge v14");
