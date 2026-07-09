require("./prebuild-user-fixes-v10.cjs");

const fs = require("fs");
const p = "app/page.jsx";
let s = fs.readFileSync(p, "utf8");

// Normalize accidental same-line state declarations left by older prebuild layers.
s = s.replace(/;\s*const \[analyticsViews, setAnalyticsViews\]/g, ";\n  const [analyticsViews, setAnalyticsViews]");
s = s.replace(/;\s*const \[analyticsLoadingSources, setAnalyticsLoadingSources\]/g, ";\n  const [analyticsLoadingSources, setAnalyticsLoadingSources]");
s = s.replace(/;\s*const \[publishedExams, setPublishedExams\]/g, ";\n  const [publishedExams, setPublishedExams]");

function dedupeState(name) {
  const pattern = new RegExp(`^\\s*const \\[${name}, [^\\]]+\\] = useState\\([^\\n]*$`);
  let seen = false;
  s = s.split("\n").filter((line) => {
    if (!pattern.test(line)) return true;
    if (seen) return false;
    seen = true;
    return true;
  }).join("\n");
}

dedupeState("rankingRows");
dedupeState("analyticsViews");
dedupeState("analyticsLoadingSources");
dedupeState("publishedExams");
dedupeState("selectedYearId");

fs.writeFileSync(p, s, "utf8");
console.log("Applied MauriResults final prebuild cleanup v11");
