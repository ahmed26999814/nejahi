"use client";

import { useEffect } from "react";

const FALLBACK_EXAM_ID = "upload-results_bac_2026";

function getPublishedExamId(exam) {
  const source = String(exam?.source_key || "").trim();
  const year = String(exam?.year || "").match(/20\d{2}/)?.[0] || "2026";
  const builtInIds = { bac: "bac", bac_2026: "bac" };

  return builtInIds[source]
    ? `${builtInIds[source]}-${year}`
    : exam?.table_name
      ? `upload-${exam.table_name}`
      : FALLBACK_EXAM_ID;
}

export default function Bac2026StatisticsAutoOpen() {
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get("open") !== "bac-2026") return undefined;

    let cancelled = false;

    async function openStatistics() {
      let examId = FALLBACK_EXAM_ID;

      try {
        const response = await fetch("/api/public-exams", { headers: { Accept: "application/json" } });
        const data = response.ok ? await response.json() : { exams: [] };
        const bac2026 = (data.exams || []).find((exam) => {
          const identity = `${exam?.source_key || ""} ${exam?.table_name || ""} ${exam?.title_ar || ""}`;
          return /results_bac_2026|bac_2026|باكالوريا\s*2026/i.test(identity);
        });
        if (bac2026) examId = getPublishedExamId(bac2026);
      } catch {}

      if (cancelled) return;
      localStorage.setItem("mauriresults-selected-year", "year-2026");
      localStorage.setItem("mauriresults-selected-exam", examId);
      window.location.replace("/#analytics");
    }

    openStatistics();
    return () => { cancelled = true; };
  }, []);

  return null;
}
