require("./prebuild-user-fixes-v10.cjs");

const fs = require("fs");
const p = "app/page.jsx";
let s = fs.readFileSync(p, "utf8");

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

fs.writeFileSync(p, s, "utf8");
console.log("Applied MauriResults final prebuild cleanup v11");
