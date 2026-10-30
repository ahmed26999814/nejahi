import originalIndex from "./indexed-drive-study-files.json" with { type: "json" };
import literaryIndex from "./ushare-literary-files.json" with { type: "json" };
import { decorateStudyFile, normalizeStudyTitle, examBrowseGroup } from "./study-catalog.mjs";

export const STUDY_LEVELS = ["7AS", "6AS", "5AS", "4AS", "6AF"];
export const LEVEL_TITLES = {
  ar: { "7AS": "البكالوريا", "6AS": "السادسة ثانوي", "5AS": "الخامسة ثانوي", "4AS": "ابريفه (3AS / 4AS)", "6AF": "كونكور" },
  fr: { "7AS": "Baccalauréat", "6AS": "6AS", "5AS": "5AS", "4AS": "BEPC (3AS / 4AS)", "6AF": "Concours" },
};

const BOOK_WORDS = /(?:^|[\s_\-])(?:livres?|manuels?|textbook|joussour|joussor|book|cours\s+en\s+livre)(?=$|[\s_\-.])|كتاب|الكتاب|كتب\s+مدرسية|جسور|المغن[ىي]|المدرسي|livrepc/i;
const EXERCISE_WORDS = /(?:^|[\s_\-])(?:exercices?|exos?|qcm|series?)(?=$|[\s_\-.])|تمارين|تطبيقات|سلاسل|سلسلة/i;

/**
 * A single canonical placement for each indexed item.
 * Explicit verified types win. The books rule catches library titles that
 * were formerly classified as generic lessons/series.
 * A PDF of exercises *from* a book is not automatically a textbook.
 */
export function studyLibraryPlacement(file) {
  if (file.verifiedType && ["books", "exams", "tests", "series", "lessons"].includes(file.verifiedType)) {
    return file.verifiedType;
  }
  const title = normalizeStudyTitle(file.title || "");
  if (BOOK_WORDS.test(title) && (!EXERCISE_WORDS.test(title) || /كتاب|livre|manuel|joussour|جسور|المغن/.test(title))) return "books";
  return file.category || "lessons";
}

export function canonicalStudyLevel(value) {
  return value === "3AS" ? "4AS" : value;
}

function catalogYear(file) {
  if (file.yearKind === "range") return "archives";
  if (file.yearKind === "academic" && file.yearLabel) return "school:" + file.yearLabel;
  if (file.yearKind === "single" && Number.isInteger(file.year)) return String(file.year);
  const years = [...new Set(String(file.title || "").match(/(?:19|20)\d{2}/g) || [])];
  return years.length === 1 ? years[0] : "undated";
}

const unique = new Map();
for (const file of [...originalIndex.files, ...literaryIndex.files]) {
  if (!unique.has(file.id)) unique.set(file.id, file);
}
export const STUDY_LIBRARY = [...unique.values()]
  .map(file => {
    const normal = decorateStudyFile({ ...file, level: canonicalStudyLevel(file.level) });
    const placement = studyLibraryPlacement(normal);
    return {
      ...normal,
      placement,
      catalogYear: catalogYear(normal),
      yearGroup: examBrowseGroup(normal),
      originalLevel: file.level,
      competition: placement === "tests"
        ? ({
          "7AS": "فروض واختبارات البكالوريا", "6AS": "فروض واختبارات السادسة",
          "5AS": "فروض واختبارات الخامسة", "4AS": "فروض واختبارات ابريفه",
          "6AF": "فروض واختبارات كونكور",
        }[normal.level] || "فروض واختبارات")
        : normal.competition,
    };
  }).filter(file => STUDY_LEVELS.includes(file.level));

export const STUDY_BOOK_FILES = STUDY_LIBRARY.filter(f => f.placement === "books");
export const STUDY_EXAM_FILES = STUDY_LIBRARY.filter(f => f.placement === "exams" || f.placement === "tests");
export const STUDY_REFERENCE_FILES = STUDY_LIBRARY.filter(f => f.placement === "lessons" || f.placement === "series");
