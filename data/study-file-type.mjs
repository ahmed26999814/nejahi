/**
 * Categorize a document from its filename only. Never infer a category from
 * its Google Drive folder: folders contain mixed disciplines and document types.
 */
export const STUDY_TYPES = ["series", "exams", "tests", "books", "lessons"];

export function normalizeStudyTitle(value = "") {
  return String(value).normalize("NFKD")
    .replace(/[\u0300-\u036f\u064b-\u065f\u0670]/g, "")
    .replace(/[\u200e\u200f\u061c]/g, "")
    .toLowerCase();
}

export function classifyStudyFile(title) {
  const t = normalizeStudyTitle(title);
  // A mock Bac / contrôle is a school test, not an official exam paper.
  if (/bac[\s_-]*blanc|exam[\s_-]*blanc|devoir|composition|controle|evaluation|\btest\b|اختبار|الاختبار|فرض|الفروض|\bex[1-5]\b|(?:^|[ _])bb[12]?(?:\b|$)/.test(t)) return "tests";
  // "Série" and exercises are kept separate from exams, even for Bac revision.
  if (/(?:^|[^a-z])(?:serie|series|exercice|exercices|exos|qcm)(?=[^a-z]|$)|feuille[_\s]*exercices|تمارين|سلسلة|سلاسل|تطبيقات/.test(t)) {
    if (/كتاب|livre|manuel/.test(t) && !/exercice|تمارين|تطبيقات/.test(t)) return "books";
    return "series";
  }
  if (/sujets?\b|annales|\bbac\b|bac[_\s-]?[a-z0-9]|bepc|bepp|concour|olympiade|rallye|session normale|session complementaire|مسابقة|باكالوريا|باكلوريا|بكالوريا|ابريفه|بريفه|كونكور|مواضيع|موضوع امتحان|الامتحانات/.test(t)) return "exams";
  if (/livre|manuel|textbook|كتاب|الكتاب|joussour|جسور|المغنى|المغني|cahier/.test(t)) return "books";
  return "lessons";
}
