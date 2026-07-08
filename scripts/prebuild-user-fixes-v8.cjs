require("./prebuild-user-fixes-v7.cjs");

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
  if (!bounds) throw new Error("Function not found: " + name);
  s = s.slice(0, bounds.start) + next + s.slice(bounds.end);
}

replaceFunction("fetchFastRankingResults", `async function fetchFastRankingResults(source, field, value) {
  if (!source || !field || !value) return [];
  const response = await fetch(\`/api/ranking?source=\${encodeURIComponent(source)}&field=\${encodeURIComponent(field)}&value=\${encodeURIComponent(value)}\`, {
    headers: { Accept: "application/json" },
  });
  if (!response.ok) throw new Error(await response.text());
  const data = await response.json();
  const rows = data.rows || [];

  if (source === "brevet") return prepareBrevetStudents(rows);
  if (source === "concours") return prepareConcoursStudents(rows);
  if (source === "bac_session") return prepareBacSessionStudents(rows);
  if (source === "excellence_1as") return prepareExcellenceStudents(rows);
  return prepareStudents(rows);
}`);

// لا تجعل الضغط على المدرسة/الولاية يحمل الجدول كاملًا؛ يعتمد فقط على /api/ranking.
s = s.replace(`    } else {
      await loadExamData(selectedExam);
    }
    setRankingTarget({ field, value, label });`, `    }
    setRankingTarget({ field, value, label });`);

fs.writeFileSync(p, s, "utf8");
console.log("Applied MauriResults direct ranking API v8");
