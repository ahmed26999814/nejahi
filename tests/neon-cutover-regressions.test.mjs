import assert from "node:assert/strict";
import test from "node:test";
import { readFileSync } from "node:fs";

const read = (file) => readFileSync(new URL("../" + file, import.meta.url), "utf8");

test("search hints do not incorrectly instruct users about a paper summons", () => {
  const search = read("components/search/SearchPanel.jsx");
  const home = read("components/home/HomeResultsFinder.jsx");
  assert.doesNotMatch(search, /تحقق من السنة والمسابقة ورقم المترشح في الاستدعاء/);
  assert.doesNotMatch(home, /الرقم الموجود في الاستدعاء/);
});
test("statistics UI is present as a normal route import, including its styles", () => {
  const home = read("components/home/HomeApplication.jsx");
  const layout = read("app/layout.jsx");
  assert.match(home, /import AnalyticsPage from ["']\.\.\/analytics\/AnalyticsPage["']/);
  assert.doesNotMatch(home, /dynamic\(\(\) => import\(["']\.\.\/analytics\/AnalyticsPage/);
  assert.match(layout, /dashboard-reference\.css/);
});
test("exam catalogue and site content never serve a day-old cached response", () => {
  for (const name of ["app/api/public-exams/route.ts","app/api/site-controls/route.ts","app/api/public-data/route.ts"]) {
    const file = read(name);
    assert.doesNotMatch(file, /stale-while-revalidate=3600|stale-while-revalidate=86400|stale-if-error=86400/);
    assert.match(file, /no-store/);
  }
  const worker = read("public/sw.js");
  assert.match(worker, /mauriresults-v15-app-shell/);
});
test("search caches stay bounded and data errors never become one-day-old hits", () => {
  assert.match(read("lib/resultShardCache.ts"), /const RESULT_CACHE_SECONDS = 600/);
  const api = read("app/api/result-shard/[sourceToken]/[shard]/route.ts");
  assert.doesNotMatch(api, /stale-while-revalidate=86400/);
});
