require("./prebuild-user-fixes-v14.cjs");

const fs = require("fs");
const p = "app/page.jsx";
let s = fs.readFileSync(p, "utf8");

// Ensure the premium home receives dynamic year cards instead of static locked YEAR_CARDS.
if (s.includes("          stats={homeStats}\n          suggestions={suggestions}") && !s.includes("          yearCards={yearCards}\n          suggestions={suggestions}")) {
  s = s.replace(
    "          stats={homeStats}\n          suggestions={suggestions}",
    "          stats={homeStats}\n          yearCards={yearCards}\n          suggestions={suggestions}"
  );
}
s = s.replace(
  /function HomeView\(\{ content, homepageBanner, lang, onSelectYear, stats, text \}\) \{/g,
  "function HomeView({ content, homepageBanner, lang, onSelectYear, stats, text, yearCards = YEAR_CARDS }) {"
);
s = s.replace(/yearCards=\{typeof yearCards !== "undefined" \? yearCards : YEAR_CARDS\}/g, "yearCards={yearCards}");

// Do not repeat decision as a lower info tile; the decision should be only the big strip under the average.
s = s.replace(/\n\s*\[text\.decision \|\| "القرار", status\.label, <InfoIcon key="decision" \/>\],/g, "");

// Add professional decision colors.
if (!s.includes("const decisionStyle =")) {
  s = s.replace(
    `  const tone = isFailed ? "calm" : getAverageTone(average);`,
    `  const tone = isFailed ? "calm" : getAverageTone(average);
  const decisionStyle = status.className === "admis"
    ? "border-emerald-400/40 bg-emerald-500/15 text-emerald-100 ring-emerald-400/20"
    : status.className === "sessionnaire"
      ? "border-amber-300/50 bg-amber-400/15 text-amber-100 ring-amber-300/20"
      : status.className === "ajourne"
        ? "border-red-300/50 bg-red-500/15 text-red-100 ring-red-300/20"
        : status.className === "absent"
          ? "border-slate-300/40 bg-slate-400/15 text-slate-100 ring-slate-300/20"
          : "border-white/20 bg-white/10 text-white ring-white/10";`
  );
}

// Remove older small decision badge if any previous script inserted it.
s = s.replace(/\n\s*\{!isConcours && \(\n\s*<span className=\{`mauri-decision-badge status-badge \$\{status\.className\} mt-3 rounded-\[18px\] px-5 py-2 text-base font-black shadow-soft md:text-lg`\}>\n\s*\{status\.label\}\n\s*<\/span>\n\s*\)\}/g, "");

// Add the large decision strip below the average.
if (!s.includes("mauri-decision-strip")) {
  s = s.replace(
    /(<strong className="mt-3 inline-flex rounded-\[18px\] bg-mauri-green\/10 px-4 py-2 text-3xl font-black text-mauri-green dark:bg-mauri-gold\/10 dark:text-mauri-gold">\s*\n\s*\{isConcours \? `\$\{average\.toFixed\(2\)\} \/ 200` : average\.toFixed\(2\)\}\s*\n\s*<\/strong>)/,
    `$1
              {!isConcours && (
                <div className={\`mauri-decision-strip mt-3 inline-flex w-fit items-center gap-3 rounded-[22px] border px-5 py-2.5 text-sm font-black shadow-soft ring-1 md:text-base \${decisionStyle}\`}>
                  <span className="rounded-full bg-white/15 px-2.5 py-1 text-[11px] font-black opacity-90">{text.decision || "القرار"}</span>
                  <strong className="text-lg md:text-xl">{status.label}</strong>
                </div>
              )}`
  );
}

fs.writeFileSync(p, s, "utf8");
console.log("Applied MauriResults decision strip and 2026 unlock v15");
