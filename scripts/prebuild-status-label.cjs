const fs = require("fs");
const path = require("path");

const target = path.join(process.cwd(), "components/home/HomeApplication.jsx");
let source = fs.readFileSync(target, "utf8");
const original = source;

// Keep recognizing the official source values ("راسب" / Ajourné),
// but always show the friendlier Arabic decision label in the interface.
source = source.replace(/concoursFailed:\s*"راسب"/, 'concoursFailed: "غير موفق"');
source = source.replace(
  /(statusLabels:\s*\{[^}\n]*ajourne:\s*)"راسب"/,
  '$1"غير موفق"'
);
source = source.replace(
  /(normalized\.includes\("ajourn"\)\s*\|\|\s*normalized\.includes\("راسب"\)\)\s*return\s*\{\s*label:\s*)"راسب"/,
  '$1"غير موفق"'
);

const stalePatterns = [
  /concoursFailed:\s*"راسب"/,
  /statusLabels:\s*\{[^}\n]*ajourne:\s*"راسب"/,
  /normalized\.includes\("ajourn"\)\s*\|\|\s*normalized\.includes\("راسب"\)\)\s*return\s*\{\s*label:\s*"راسب"/,
];

if (stalePatterns.some((pattern) => pattern.test(source))) {
  throw new Error('Failed to replace the displayed failure label with "غير موفق".');
}

if (source !== original) {
  fs.writeFileSync(target, source, "utf8");
  console.log('Updated displayed failure label to "غير موفق".');
}
