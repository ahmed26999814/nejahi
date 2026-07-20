export const SEARCH_CACHE_TAG = "mauriresults-number-search-v2";
export const FILTER_CACHE_TAG = "mauriresults-exam-filters-v2";
export const PUBLIC_EXAMS_CACHE_TAG = "mauriresults-public-exams-v4";
export const DASHBOARD_CACHE_TAG = "mauriresults-dashboard-v2";

function safeTagPart(value: string) {
  return String(value || "")
    .trim()
    .replace(/[^A-Za-z0-9:_-]/g, "-")
    .slice(0, 160);
}

export function searchSourceTag(source: string) {
  return `${SEARCH_CACHE_TAG}:${safeTagPart(source)}`;
}

export function filterSourceTag(source: string) {
  return `${FILTER_CACHE_TAG}:${safeTagPart(source)}`;
}

export function dashboardSourceTag(source: string) {
  return `${DASHBOARD_CACHE_TAG}:${safeTagPart(source)}`;
}
