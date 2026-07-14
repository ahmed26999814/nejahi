import type { AnalyticsData, Exam, ResultRow } from "../types";

export const API_BASE_URL = "https://mauri-results.vercel.app";
const TIMEOUT_MS = 12000;

async function requestJson<T>(path: string): Promise<T> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
  try {
    const response = await fetch(`${API_BASE_URL}${path}`, {
      headers: { Accept: "application/json" },
      signal: controller.signal,
    });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(String(data?.error || response.statusText || "Request failed"));
    return data as T;
  } finally {
    clearTimeout(timer);
  }
}

export async function fetchExams(): Promise<Exam[]> {
  const data = await requestJson<{ exams?: Exam[] }>("/api/public-exams");
  return Array.isArray(data.exams) ? data.exams : [];
}

export async function searchResults(source: string, query: string): Promise<ResultRow[]> {
  const params = new URLSearchParams({ source, q: query });
  const data = await requestJson<{ rows?: ResultRow[] }>(`/api/search?${params.toString()}`);
  return Array.isArray(data.rows) ? data.rows : [];
}

export async function fetchAnalytics(source: string): Promise<AnalyticsData> {
  const params = new URLSearchParams({ source });
  return requestJson<AnalyticsData>(`/api/published-exam-analytics?${params.toString()}`);
}
