import fs from "node:fs";

const path = "components/home/HomeApplication.jsx";
let source = fs.readFileSync(path, "utf8").replace(/^\uFEFF/, "");

const replacements = [
  {
    from: 'function HomeView({ content, homepageBanner, lang, onSelectYear, stats, text }) {',
    to: 'function HomeView({ content, homepageBanner, lang, onSelectYear, stats, text, yearCards }) {',
    label: "HomeView yearCards prop",
  },
  {
    from: '          onSelectYear={openYear}\n          onSelectExam={openExam}',
    to: '          onSelectYear={openYear}\n          yearCards={yearCards}\n          onSelectExam={openExam}',
    label: "HomeView yearCards call",
  },
  {
    from: '    ];\n\n  useEffect(() => {\n    if (!isPassed) return undefined;',
    to: '    ];\n\n  const visibleDetails = details.filter(([, value]) => {\n    const normalized = cleanText(value);\n    if (!normalized) return false;\n    const unavailableValues = new Set([\n      cleanText(text.unavailable),\n      "غير متوفر",\n      "غير متوفرة",\n      "Non disponible",\n      "Unavailable",\n    ].filter(Boolean));\n    return !unavailableValues.has(normalized);\n  });\n\n  useEffect(() => {\n    if (!isPassed) return undefined;',
    label: "visible result details",
  },
  {
    from: '        {details.map(([label, value, icon, onClick]) => (\n          <InfoTile icon={icon} label={label} onClick={onClick} value={value} key={label} />\n        ))}',
    to: '        {visibleDetails.map(([label, value, icon, onClick]) => (\n          <InfoTile icon={icon} label={label} onClick={onClick} value={value} key={label} />\n        ))}',
    label: "visible details render",
  },
  {
    from: '<span className="grid h-9 w-9 place-items-center rounded-[14px] bg-mauri-green/10 text-sm font-black text-mauri-green dark:bg-emerald-300/10 dark:text-emerald-300">#{index + 1}</span>',
    to: '<span className="grid h-9 w-9 place-items-center rounded-[14px] bg-mauri-green/10 text-sm font-black text-mauri-green dark:bg-emerald-300/10 dark:text-emerald-300">#{student.rank || index + 1}</span>',
    label: "ranking row database rank",
  },
];

for (const replacement of replacements) {
  if (!source.includes(replacement.from)) {
    throw new Error(`Patch target missing: ${replacement.label}`);
  }
  source = source.replace(replacement.from, replacement.to);
}

fs.writeFileSync(path, source, "utf8");
console.log("Phase 1 HomeApplication patch applied.");
