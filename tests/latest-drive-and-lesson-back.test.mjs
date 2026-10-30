import assert from "node:assert/strict";
import { test } from "node:test";
import { readFileSync } from "node:fs";
import { STUDY_LIBRARY, STUDY_BOOK_FILES, STUDY_EXAM_FILES, STUDY_REFERENCE_FILES } from "../data/study-library.mjs";
import { ownedDriveCopyId } from "../lib/study-download.mjs";
const content = path => readFileSync(new URL("../" + path, import.meta.url), "utf8");

const added = [
  "1z1pyYUvPt9ueiNms7gM8t9mcQ73GZ8Yp", "1rUS8ZZIXi_2BiEu1hOPYvCwvJ4PllDLS",
  "1v0fUwxfKBaootvv_LJ_lRaAJGOvH3L1R", "1DsvGD8wnO2Tu9iiqfY2dpVNY8zEBh3u-",
  "1OKswu1lyoFBRD81Qr4fZYoRLWWYHpR09", "1PcRwTZJt-kH0gnOfWHuMsrbw4mRmRdqG",
  "1iThVR1ktOE2cztwe0xavLSwSHaeoPWLi", "1zYLfugXYDbBR1ode2cQc_oi3pSttl3m5",
  "1vAvqq9iv11djeE2-ilmfQeQrJJxrEdlA", "1ayAzhV55ZwMqXmwlT9W43YqUAScmI7xs",
  "1HKn1V9_3JCRJ-BXogO7Q0tjsAhUaqK4O", "1krJ2zJbPmj7g3huxJz7L8V7_ZXFoUl0Z",
  "1L9pdpUTmkNpULeAUp-bl4aruANH125lr", "1lc2nCLc6MCtFDwmh1Db1WAuuVMC0vxYs",
  "1y7eZsafg9icqCDBeKaCStjgfrHGfSw-Y", "1r-zV_Owb7Cm4qs2yXstWTRfERzNp9c90",
];
const duplicateIds = [
  "1rVGy5zxfDFCx0H0NCQMZRkoXCwfWXbYm",
  "1aiHw2se9JiUvSDxuoDYz0kPUshN7E062",
  "1cZwUZZmkHDKMyqV41CtFcZYckMNd2mL_",
];
test("16 of 20 new files are indexed, omitting three duplicates and a screenshot", () => {
  assert.equal(STUDY_LIBRARY.length, 712);
  const seen = new Set(STUDY_LIBRARY.map(file => file.id));
  assert.equal(seen.size, 712);
  for (const id of added) {
    assert.ok(seen.has(id), id);
    assert.equal(ownedDriveCopyId(id), id);
  }
  for (const id of duplicateIds) assert.ok(!seen.has(id));
  assert.ok(!seen.has("1WB0lNBu2_kMh2UG8P6R0gQEbSWCAq-hB"));
});

test("latest files are divided into their real level and collection", () => {
  const byId = Object.fromEntries(STUDY_LIBRARY.map(file => [file.id, file]));
  assert.equal(byId["1rUS8ZZIXi_2BiEu1hOPYvCwvJ4PllDLS"].level, "6AF");
  assert.equal(byId["1rUS8ZZIXi_2BiEu1hOPYvCwvJ4PllDLS"].placement, "books");
  assert.equal(byId["1ayAzhV55ZwMqXmwlT9W43YqUAScmI7xs"].level, "1AF");
  assert.equal(byId["1iThVR1ktOE2cztwe0xavLSwSHaeoPWLi"].level, "4AS");
  assert.equal(byId["1iThVR1ktOE2cztwe0xavLSwSHaeoPWLi"].placement, "exams");
  assert.equal(byId["1y7eZsafg9icqCDBeKaCStjgfrHGfSw-Y"].placement, "exams");
  assert.equal(byId["1v0fUwxfKBaootvv_LJ_lRaAJGOvH3L1R"].placement, "series");
  assert.equal([STUDY_BOOK_FILES, STUDY_EXAM_FILES, STUDY_REFERENCE_FILES].reduce((n, group) => n + group.length, 0), 712);
});

test("browser Back returns inside lesson cards using URL state for every tab", () => {
  for (const path of ["app/lessons/LessonsExplorer.jsx",
    "components/documents/StudyResourceLibrary.jsx",
    "components/documents/ExamLibrary.jsx"]) {
    const source = content(path);
    assert.match(source, /pushState/);
    assert.match(source, /popstate/);
  }
  const tabs = content("app/lessons/LessonsAndExams.jsx");
  assert.match(tabs, /pushState/);
  assert.match(tabs, /popstate/);
  const header = content("components/layout/IntegratedSectionShell.jsx");
  assert.match(header, /section === "lessons"/);
  assert.match(header, /new PopStateEvent\("popstate"\)/);
  assert.match(header, /url\.searchParams\.has\("stage"\)/);
});

test("readers return to the same tab and selection rather than the homepage", () => {
  const books = content("app/lessons/LessonsExplorer.jsx");
  const refs = content("components/documents/StudyResourceLibrary.jsx");
  const exams = content("components/documents/ExamLibrary.jsx");
  const reader = content("app/study/reader/page.jsx");
  const official = content("app/study/book-reader/page.jsx");
  assert.match(books, /from=books/);
  assert.match(refs, /from:"resources"/);
  assert.match(exams, /from:"exams"/);
  assert.match(reader, /internalReturnPath/);
  assert.match(reader, /href=\{backPath\}/);
  assert.match(official, /href=\{backPath\}/);
});
