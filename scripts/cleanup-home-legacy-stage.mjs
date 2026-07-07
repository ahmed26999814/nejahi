import { readFileSync, writeFileSync } from "node:fs";

const file = "app/page.jsx";
let source = readFileSync(file, "utf8");
const original = source;

const ready = source.includes('import PremiumHomeView from "../components/home/PremiumHomeView";') && source.includes("<PremiumHomeView");

if (!ready) {
  console.log("Cleanup skipped. PremiumHomeView is not connected yet.");
  process.exit(0);
}

function removeFunction(name) {
  const marker = `function ${name}(`;
  const start = source.indexOf(marker);
  if (start < 0) return false;
  if (source.includes(`<${name}`)) {
    console.log(`skip ${name}: still used in JSX`);
    return false;
  }

  const bodyStart = source.indexOf("{", start);
  if (bodyStart < 0) return false;

  let depth = 0;
  for (let index = bodyStart; index < source.length; index += 1) {
    const char = source[index];
    if (char === "{") depth += 1;
    if (char === "}") depth -= 1;
    if (depth === 0) {
      const end = index + 1;
      source = source.slice(0, start) + source.slice(end).replace(/^\n+/, "\n");
      console.log(`Removed legacy ${name}.`);
      return true;
    }
  }

  return false;
}

removeFunction("Hero");

if (source !== original) {
  writeFileSync(file, source, "utf8");
  console.log("Home legacy cleanup completed.");
} else {
  console.log("No home legacy cleanup needed.");
}
