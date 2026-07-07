import { readFileSync, writeFileSync } from "node:fs";

const file = "app/page.jsx";
let source = readFileSync(file, "utf8");
const original = source;
const oldImport = 'import { CandidateProfileCard, StatusBadge } from "../components/results/ResultDesignKit";';
const newImport = 'import { CandidateProfileCard, ResultDetailsGrid, StatusBadge } from "../components/results/ResultDesignKit";';

if (source.includes(oldImport)) {
  source = source.replace(oldImport, newImport);
}

const oldBlock = `<div className="mt-4 grid grid-cols-2 gap-2">
        {details.map(([label, value, icon, onClick]) => (
          <InfoTile icon={icon} label={label} onClick={onClick} value={value} key={label} />
        ))}
      </div>`;

const newBlock = `<ResultDetailsGrid details={details} />`;

if (source.includes(oldBlock) && !source.includes(newBlock)) {
  source = source.replace(oldBlock, newBlock);
}

if (source !== original) {
  writeFileSync(file, source, "utf8");
  console.log("Result details grid connected.");
} else {
  console.log("Result details grid already connected or target block changed.");
}
