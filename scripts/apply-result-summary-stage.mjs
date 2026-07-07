import { readFileSync, writeFileSync } from "node:fs";

const file = "app/page.jsx";
let source = readFileSync(file, "utf8");
const original = source;
const importLine = 'import ResultOfficialSummary from "../components/results/ResultOfficialSummary";';
const anchor = 'import { CandidateProfileCard, StatusBadge } from "../components/results/ResultDesignKit";';

if (!source.includes(importLine)) {
  source = source.replace(anchor, `${anchor}\n${importLine}`);
}

const oldBlock = `<CandidateProfileCard
          name={student.name}
          id={student.id}
          school={student.ms || student.centre || text.unavailable}
          status={status.className}
          statusLabel={status.label}
          score={getAverage(student).toFixed(2)}
          maxScore={isConcours ? 200 : undefined}
        />`;

const newBlock = `<ResultOfficialSummary
          average={getAverage(student).toFixed(2)}
          code={verificationCode}
          exam={student.sessionType || (isConcours ? "كونكور 2025" : student.source === "brevet" ? "أبريفه 2025" : student.source === "excellence_1as" ? "الامتياز الأولى إعدادية 2025" : "البكالوريا 2025")}
          maxScore={isConcours ? 200 : undefined}
          name={student.name}
          number={student.id}
          status={status.className}
          statusLabel={status.label}
          text={text}
        />`;

if (source.includes(oldBlock) && !source.includes("<ResultOfficialSummary")) {
  source = source.replace(oldBlock, newBlock);
}

if (source !== original) {
  writeFileSync(file, source, "utf8");
  console.log("Result summary connected.");
} else {
  console.log("Result summary already connected or target block changed.");
}
