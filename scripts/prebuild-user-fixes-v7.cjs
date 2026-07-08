require("./prebuild-user-fixes-v6.cjs");

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
  throw new Error("Function not found: " + name);
}

function replaceFunction(name, next) {
  const bounds = findFunctionBounds(name);
  s = s.slice(0, bounds.start) + next + s.slice(bounds.end);
}

replaceFunction("searchResults", `async function searchResults(query, exam) {
  if (!exam?.source) throw new Error("Missing selected exam.");
  const response = await fetch(`/api/search?source=${encodeURIComponent(exam.source)}&q=${encodeURIComponent(query.trim())}`, {
    headers: { Accept: "application/json" },
  });
  if (!response.ok) throw new Error(await response.text());
  const data = await response.json();
  const rows = data.rows || [];

  if (exam.source === "brevet") return prepareBrevetStudents(rows);
  if (exam.source === "concours") return prepareConcoursStudents(rows);
  if (exam.source === "bac_session") return prepareBacSessionStudents(rows);
  if (exam.source === "excellence_1as") return prepareExcellenceStudents(rows);
  return prepareStudents(rows);
}`);

// Show result immediately after search; do not keep artificial delay.
s = s.replace(/\},\s*120\);/g, "}, 20);");
s = s.replace(/\},\s*520\);/g, "}, 20);");

// Make sure the user-facing loading wording is clear.
s = s.replace(/جاري تحضير بطاقة النتيجة/g, "جاري تحضير النتيجة");
s = s.replace(/جاري فتح بطاقة النتيجة/g, "جاري عرض النتيجة");
s = s.replace(/جاري عرض بطاقة النتيجة/g, "جاري عرض النتيجة");

fs.writeFileSync(p, s, "utf8");
console.log("Applied MauriResults fast API search v7");
