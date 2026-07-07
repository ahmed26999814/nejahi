import { existsSync } from "node:fs";
import { spawnSync } from "node:child_process";

const steps = [
  "scripts/apply-result-summary-stage.mjs",
  "scripts/apply-result-details-stage.mjs",
  "scripts/apply-result-actions-stage.mjs",
];

for (const step of steps) {
  if (!existsSync(step)) {
    console.log(`skip missing: ${step}`);
    continue;
  }

  console.log(`run: ${step}`);
  const result = spawnSync(process.execPath, [step], { stdio: "inherit" });
  if (result.status !== 0) {
    console.error(`failed: ${step}`);
    process.exit(result.status || 1);
  }
}

console.log("Result polish bundle completed.");
