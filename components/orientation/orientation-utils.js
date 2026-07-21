import { STREAM_ALIASES } from "../../data/orientation-programs";

export const PAGE_SIZE = 18;
export const SAVED_KEY = "mauriresults-orientation-saved";
export const COMPARE_KEY = "mauriresults-orientation-compare";

export const STATUS_STYLES = {
  strong: {
    label: "فرصة قوية",
    className:
      "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-300/20 dark:bg-emerald-300/10 dark:text-emerald-200",
  },
  possible: {
    label: "فرصة محتملة",
    className:
      "border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-300/20 dark:bg-amber-300/10 dark:text-amber-200",
  },
  difficult: {
    label: "خيار طموح",
    className:
      "border-rose-200 bg-rose-50 text-rose-700 dark:border-rose-300/20 dark:bg-rose-300/10 dark:text-rose-200",
  },
  reference: {
    label: "معدل مرجعي",
    className:
      "border-slate-200 bg-slate-50 text-slate-600 dark:border-white/10 dark:bg-white/5 dark:text-slate-300",
  },
};

export function normalizeStream(value) {
  const cleaned = String(value || "").trim();
  return STREAM_ALIASES[cleaned] || cleaned;
}

export function parseScore(value) {
  if (value === "" || value === null || value === undefined) return null;
  const parsed = Number.parseFloat(String(value).replace(",", "."));
  return Number.isFinite(parsed) ? parsed : null;
}

export function getFit(program, average) {
  if (!Number.isFinite(average)) return { key: "reference", delta: null };
  const delta = average - program.lastScore;
  if (delta >= 0.5) return { key: "strong", delta };
  if (delta >= -0.3) return { key: "possible", delta };
  return { key: "difficult", delta };
}

export function readStoredIds(key) {
  try {
    const parsed = JSON.parse(localStorage.getItem(key) || "[]");
    return Array.isArray(parsed) ? parsed.filter((id) => typeof id === "string") : [];
  } catch {
    return [];
  }
}
