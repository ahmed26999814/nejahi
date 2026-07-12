export const EMPTY_FILTERS = Object.freeze({
  track: "",
  wilaya: "",
  centre: "",
  school: "",
});

export const EMPTY_FILTER_OPTIONS = Object.freeze({
  track: [],
  wilaya: [],
  centre: [],
  school: [],
});

export const FILTER_LABELS = Object.freeze({
  track: "الشعب",
  wilaya: "الولايات",
  centre: "المراكز",
  school: "المدارس",
});

export function isBrevetSource(source) {
  return source === "brevet" || /bepc|brevet/i.test(String(source || ""));
}

export function getFilterLevels(source) {
  return isBrevetSource(source)
    ? ["wilaya", "centre", "school"]
    : ["track", "wilaya", "centre", "school"];
}

export function normalizeExamSource(value) {
  const id = decodeURIComponent(String(value || ""))
    .replace(/^#/, "")
    .trim()
    .toLowerCase();

  if (!id) return "";

  const uploadedMatch = id.match(/upload[:/-]([a-z0-9_]+)/i);
  if (uploadedMatch?.[1]) return `upload:${uploadedMatch[1]}`;

  if (/concours|c1as|كونكور/.test(id)) return "";
  if (/bac.*(?:session|sc|supp|compl)|(?:session|sc|supp|compl).*bac|تكمي/.test(id)) return "bac_session";
  if (/brevet|bepc|ابريف|أبريف|بريف/.test(id)) return "brevet";
  if (/(^|[-_])bac($|[-_0-9])|baccalaur/.test(id)) return "bac";
  return "";
}

export function resolveExamSource() {
  // The current route is the source of truth. This prevents an older exam
  // saved in localStorage from overriding a newly opened uploaded exam.
  const hashSource = normalizeExamSource(window.location.hash);
  if (hashSource) return hashSource;

  const stored = localStorage.getItem("mauriresults-selected-exam") || "";
  const storedSource = normalizeExamSource(stored);
  if (storedSource) return storedSource;

  const pageText = document.body?.textContent || "";
  if (/الدورة التكميلية|session complémentaire/i.test(pageText)) return "bac_session";
  if (/نتائج أبريفه|نتائج ابريفه|BEPC|Brevet/i.test(pageText)) return "brevet";
  if (/نتائج باكالوريا|نتائج البكالوريا|Baccalauréat|Bac 20/i.test(pageText)) return "bac";
  return "";
}

export function totalOptions(options) {
  return options.reduce((sum, item) => sum + Number(item.total || 0), 0);
}

export function getDecisionLabel(value) {
  return /sessionnaire|تكميلية|تكميلي/i.test(String(value || ""))
    ? "دورة تكميلية"
    : "ناجح";
}

export function formatCandidateScore(value) {
  const score = Number(value);
  return Number.isFinite(score) ? score.toFixed(2) : "—";
}
