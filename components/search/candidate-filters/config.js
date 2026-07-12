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
  const id = String(value || "").replace(/^#/, "").trim().toLowerCase();
  if (!id) return "";
  if (id.startsWith("upload-")) return `upload:${id.slice(7)}`;
  if (id.startsWith("upload:")) return id;
  if (/concours|c1as|كونكور/.test(id)) return "";
  if (/bac.*(?:session|sc|supp|compl)|(?:session|sc|supp|compl).*bac|تكمي/.test(id)) return "bac_session";
  if (/brevet|bepc|ابريف|أبريف|بريف/.test(id)) return "brevet";
  if (/(^|[-_])bac($|[-_0-9])|baccalaur/.test(id)) return "bac";
  return "";
}

export function resolveExamSource() {
  const stored = localStorage.getItem("mauriresults-selected-exam") || "";
  const storedSource = normalizeExamSource(stored);
  if (storedSource) return storedSource;

  const hashSource = normalizeExamSource(window.location.hash);
  if (hashSource) return hashSource;

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
