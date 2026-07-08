require("./prebuild-user-fixes-v6.cjs");

const fs = require("fs");
const p = "app/page.jsx";
let s = fs.readFileSync(p, "utf8");

// 10 second timeout for every Supabase REST request.
if (!s.includes("const SUPABASE_REQUEST_TIMEOUT_MS = 10000;")) {
  s = s.replace("const SITE_CONTENT_TABLE = \"site_content\";", "const SITE_CONTENT_TABLE = \"site_content\";\nconst SUPABASE_REQUEST_TIMEOUT_MS = 10000;");
}

s = s.replace(
`  const response = await fetch(url, {
    headers: {
      apikey: SUPABASE_KEY,
      Authorization: \`Bearer ${SUPABASE_KEY}\`,
      Accept: "application/json",
    },
  });`,
`  const controller = new AbortController();
  const timeout = window.setTimeout(() => controller.abort(), SUPABASE_REQUEST_TIMEOUT_MS);
  let response;
  try {
    response = await fetch(url, {
      signal: controller.signal,
      headers: {
        apikey: SUPABASE_KEY,
        Authorization: \`Bearer ${SUPABASE_KEY}\`,
        Accept: "application/json",
      },
    });
  } finally {
    window.clearTimeout(timeout);
  }`
);

// Numeric searches should request one row only; name searches keep max 20 rows.
s = s.replace(
`    const rows = await supabaseRequest({
      select: "Num_Bepc,NOM,Moyenne_Bepc,Decision,Ecole,Centre,WILAYA,LIEU_NAIS,DATE_NAISS",
      or: isNumeroSearch ? \`(${numbers.map((number) => \`Num_Bepc.eq.${number}\`).join(",")},NOM.ilike.*${value}*)\` : "",
      NOM: isNumeroSearch ? "" : \`ilike.*${value}*\`,
      limit: 20,
    }, BREVET_TABLE);`,
`    const rows = await supabaseRequest({
      select: "Num_Bepc,NOM,Moyenne_Bepc,Decision,Ecole,Centre,WILAYA,LIEU_NAIS,DATE_NAISS",
      or: isNumeroSearch ? \`(${numbers.map((number) => \`Num_Bepc.eq.${number}\`).join(",")})\` : "",
      NOM: isNumeroSearch ? "" : \`ilike.*${value}*\`,
      limit: isNumeroSearch ? 1 : 20,
    }, BREVET_TABLE);`
);

s = s.replace(
`      or: isNumeroSearch ? \`(${numbers.map((number) => \`NODOSS.eq.${number}\`).join(",")},${numbers.map((number) => \`Numéro_C1AS.eq.${number}\`).join(",")})\` : \`(NOM_AR.ilike.*${value}*)\`,
      limit: 20,`,
`      or: isNumeroSearch ? \`(${numbers.map((number) => \`NODOSS.eq.${number}\`).join(",")},${numbers.map((number) => \`Numéro_C1AS.eq.${number}\`).join(",")})\` : \`(NOM_AR.ilike.*${value}*)\`,
      limit: isNumeroSearch ? 1 : 20,`
);

s = s.replace(
`      or: isNumeroSearch ? \`(${numbers.map((number) => \`NODOSS.eq.${number}\`).join(",")},NOM_AR.ilike.*${value}*,NOM_FR.ilike.*${value}*)\` : \`(NOM_AR.ilike.*${value}*,NOM_FR.ilike.*${value}*)\`,
      limit: 20,`,
`      or: isNumeroSearch ? \`(${numbers.map((number) => \`NODOSS.eq.${number}\`).join(",")})\` : \`(NOM_AR.ilike.*${value}*,NOM_FR.ilike.*${value}*)\`,
      limit: isNumeroSearch ? 1 : 20,`
);

s = s.replace(
`      or: isNumeroSearch ? \`(${numbers.map((number) => \`Num_Excellence_1AS.eq.${number}\`).join(",")},Nom.ilike.*${value}*)\` : \`(Nom.ilike.*${value}*)\`,
      limit: 20,`,
`      or: isNumeroSearch ? \`(${numbers.map((number) => \`Num_Excellence_1AS.eq.${number}\`).join(",")})\` : \`(Nom.ilike.*${value}*)\`,
      limit: isNumeroSearch ? 1 : 20,`
);

s = s.replace(
`    or: isNumeroSearch ? \`${numbers.map((number) => \`Numero.eq.${number}\`).join(",")},NOM.ilike.*${value}*)\` : "",
    NOM: isNumeroSearch ? "" : \`ilike.*${value}*\`,
    limit: 20,`,
`    or: isNumeroSearch ? \`(${numbers.map((number) => \`Numero.eq.${number}\`).join(",")})\` : "",
    NOM: isNumeroSearch ? "" : \`ilike.*${value}*\`,
    limit: isNumeroSearch ? 1 : 20,`
);

// Do not load all rows automatically when navigating to exam/search pages.
s = s.replace(`    if (view === "exam" && selectedExam) {
      await loadExamData(selectedExam);
    }
`, "");

// Make result display immediate; no artificial wait.
s = s.replace(/\n\s*window\.setTimeout\(\(\) => \{\s*\n\s*setSelectedStudent\(known \|\| student\);\s*\n\s*setResultLoading\(false\);\s*\n\s*setResultPageOpen\(true\);\s*\n\s*setActiveView\("result"\);\s*\n\s*window\.history\.pushState\(\{ view: "result" \}, "", "#result"\);\s*\n\s*window\.scrollTo\(\{ top: 0, behavior: "smooth" \}\);\s*\n\s*\},\s*\d+\);/,
`\n    setSelectedStudent(known || student);
    setResultLoading(false);
    setResultPageOpen(true);
    setActiveView("result");
    window.history.pushState({ view: "result" }, "", "#result");
    window.scrollTo({ top: 0, behavior: "smooth" });`
);

fs.writeFileSync(p, s, "utf8");
console.log("Applied direct search optimization v7");
