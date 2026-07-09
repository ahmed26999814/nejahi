require("./prebuild-user-fixes-v7.cjs");

const fs = require("fs");
const p = "app/page.jsx";
let s = fs.readFileSync(p, "utf8");

// Make ExamSelector safe after dynamic cards patch. It is used from Analytics/Toppers without explicit props.
s = s.replace(
  `function ExamSelector({ lang, onSelectExam, selectedExamId, text }) {`,
  `function ExamSelector({ examCards = EXAM_CARDS, lang, onSelectExam, selectedExamId, text }) {`
);
s = s.replace(
  `{EXAM_CARDS.filter((exam) => exam.available).map((exam) => (`,
  `{examCards.filter((exam) => exam.available).map((exam) => (`
);
s = s.replace(
  `{EXAM_CARDS.map((exam) => (`,
  `{examCards.map((exam) => (`
);

// Pass dynamic cards to the page that lists exams.
s = s.replace(
  `<CompetitionCards lang={lang} onSelectExam={onSelectExam} selectedExamId={selectedExamId} text={text} />`,
  `<CompetitionCards examCards={examCards} lang={lang} onSelectExam={onSelectExam} selectedExamId={selectedExamId} text={text} />`
);
s = s.replace(
  `function CompetitionCards({ lang, onSelectExam, selectedExamId, text }) {`,
  `function CompetitionCards({ examCards = EXAM_CARDS, lang, onSelectExam, selectedExamId, text }) {`
);

fs.writeFileSync(p, s, "utf8");
console.log("Applied MauriResults final dynamic publish patch v9");
