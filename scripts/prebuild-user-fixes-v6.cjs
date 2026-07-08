require("./prebuild-user-fixes-v5.cjs");

const fs = require("fs");
const p = "app/page.jsx";
let s = fs.readFileSync(p, "utf8");

function insertOnce(marker, text) {
  if (!s.includes(text.trim().split("\n")[0])) {
    const i = s.indexOf(marker);
    if (i >= 0) s = s.slice(0, i) + text + s.slice(i);
  }
}

s = s.replace('const BAC_TABLE = "bac_results";', 'const BAC_TABLE = "bac_results";\nconst BAC_RANKED_VIEW = "bac_ranked_results";');

s = s.replace(
  '        MOD: getColumn(row, "MOD", "mod", "Moyenne", "moyenne"),\n        kr:',
  '        MOD: getColumn(row, "MOD", "mod", "Moyenne", "moyenne"),\n        rankFromDb: Number(getColumn(row, "rank", "Rank", "RANK")) || null,\n        kr:'
);
s = s.replace('    student.rank = index + 1;', '    student.rank = student.rankFromDb || index + 1;');

s = s.replace(
`  const numbers = numberSearchValues(query, 5);
  const rows = await supabaseRequest({
    select: "Numero,NOM,TS,MOD,KR,WL,MS,MD",
    or: isNumeroSearch ? ` + "`${numbers.map((number) => `Numero.eq.${number}`).join(\",\")},NOM.ilike.*${value}*)`" + ` : "",
    NOM: isNumeroSearch ? "" : ` + "`ilike.*${value}*`" + `,
    limit: 20,
  }, BAC_TABLE);
  return prepareStudents(rows);`,
`  const numbers = numberSearchValues(query, 5);
  const bacParams = {
    select: "Numero,NOM,TS,MOD,KR,WL,MS,MD,rank",
    or: isNumeroSearch ? ` + "`${numbers.map((number) => `Numero.eq.${number}`).join(\",\")},NOM.ilike.*${value}*)`" + ` : "",
    NOM: isNumeroSearch ? "" : ` + "`ilike.*${value}*`" + `,
    limit: 20,
  };
  try {
    return prepareStudents(await supabaseRequest(bacParams, BAC_RANKED_VIEW));
  } catch (error) {
    console.warn("[MauriResults Bac Ranked View Missing]", error);
    const { select, ...fallbackParams } = bacParams;
    const rows = await supabaseRequest({ ...fallbackParams, select: "Numero,NOM,TS,MOD,KR,WL,MS,MD" }, BAC_TABLE);
    return prepareStudents(rows);
  }`
);

s = s.replace(
`      const rankingPool = selectedExam?.source === "bac" ? await loadExamData(selectedExam) : searchPool;
      const rows = await searchResults(value, selectedExam);
      const found = rows.map((student) => {
        const known = rankingPool.find((item) => normalizeCandidateNumber(item.id) === normalizeCandidateNumber(student.id));
        return known ? { ...student, rank: known.rank } : student;
      }).filter((student) => selectedExam?.filter === "sessionnaire" ? getOfficialStatus(student.kr).className === "sessionnaire" : true);`,
`      const rows = await searchResults(value, selectedExam);
      const found = rows.map((student) => {
        const known = searchPool.find((item) => normalizeCandidateNumber(item.id) === normalizeCandidateNumber(student.id));
        return known ? { ...student, rank: student.rank || known.rank } : student;
      }).filter((student) => selectedExam?.filter === "sessionnaire" ? getOfficialStatus(student.kr).className === "sessionnaire" : true);`
);

s = s.replace(/جاري تحضير بطاقة النتيجة/g, "جاري تحضير النتيجة");
s = s.replace(/جاري فتح بطاقة النتيجة/g, "جاري عرض النتيجة");
s = s.replace(/جاري عرض بطاقة النتيجة/g, "جاري عرض النتيجة");

if (!s.includes('activeView === "contact" && <ContactPage')) {
  s = s.replace(
    '      {activeView === "analytics" && <AnalyticsPage',
    '      {activeView === "contact" && <ContactPage text={text} />}\n      {activeView === "analytics" && <AnalyticsPage'
  );
}

const contactPage = `
function ContactPage({ text }) {
  return (
    <section className="app-shell grid gap-4 py-4 md:gap-6 md:py-8">
      <PageHero eyebrow="MauriResults" title="اتصل بنا" description="اختر طريقة التواصل المناسبة، وسنكون سعداء باستقبال ملاحظاتك حول النتائج." icon={<InfoIcon />} />
      <section className="grid gap-3 md:grid-cols-2">
        <a className="group relative overflow-hidden rounded-[30px] border border-emerald-200 bg-emerald-50 p-5 text-start shadow-premium transition hover:-translate-y-1 dark:border-emerald-300/20 dark:bg-emerald-300/10" href="https://wa.me/22232965875" target="_blank" rel="noopener">
          <span className="grid h-14 w-14 place-items-center rounded-2xl bg-emerald-600 text-2xl text-white shadow-soft">💬</span>
          <strong className="mt-4 block text-xl font-black text-emerald-800 dark:text-emerald-200">تواصل عبر واتساب</strong>
          <small className="mt-2 block text-sm font-bold text-emerald-700/80 dark:text-emerald-100/80">32965875</small>
        </a>
        <a className="group relative overflow-hidden rounded-[30px] border border-blue-200 bg-blue-50 p-5 text-start shadow-premium transition hover:-translate-y-1 dark:border-blue-300/20 dark:bg-blue-300/10" href="https://www.facebook.com/profile.php?id=61591701182537" target="_blank" rel="noopener">
          <span className="grid h-14 w-14 place-items-center rounded-2xl bg-blue-600 text-2xl text-white shadow-soft">f</span>
          <strong className="mt-4 block text-xl font-black text-blue-800 dark:text-blue-200">صفحتنا على فيسبوك</strong>
          <small className="mt-2 block text-sm font-bold text-blue-700/80 dark:text-blue-100/80">تابع آخر أخبار المنصة والتحديثات</small>
        </a>
      </section>
    </section>
  );
}
`;
insertOnce("function HomeView", contactPage);

fs.writeFileSync(p, s, "utf8");
console.log("Applied MauriResults contact page and fast BAC search v6");
