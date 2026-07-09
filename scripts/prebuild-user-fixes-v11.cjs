require("./prebuild-user-fixes-v10.cjs");

const fs = require("fs");
const p = "app/page.jsx";
let s = fs.readFileSync(p, "utf8");

// Normalize accidental same-line state declarations left by older prebuild layers.
s = s.replace(/;\s*const \[analyticsViews, setAnalyticsViews\]/g, ";\n  const [analyticsViews, setAnalyticsViews]");
s = s.replace(/;\s*const \[analyticsLoadingSources, setAnalyticsLoadingSources\]/g, ";\n  const [analyticsLoadingSources, setAnalyticsLoadingSources]");
s = s.replace(/;\s*const \[publishedExams, setPublishedExams\]/g, ";\n  const [publishedExams, setPublishedExams]");

function collapseDuplicateState(name) {
  const sameLine = new RegExp(`(\\s*const \\[${name}, [^\\]]+\\] = useState\\([^;]+\\);)(?:\\s*const \\[${name}, [^\\]]+\\] = useState\\([^;]+\\);)+`, "g");
  s = s.replace(sameLine, "$1");

  const line = new RegExp(`^\\s*const \\[${name}, [^\\]]+\\] = useState\\([^;]+\\);\\s*$`);
  let seen = false;
  s = s.split("\n").filter((currentLine) => {
    if (!line.test(currentLine)) return true;
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
