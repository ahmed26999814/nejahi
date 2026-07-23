"use client";

import { useEffect } from "react";

const FALLBACK_EXAM_ID = "upload-results_bac_2026";

function getPublishedExamId(exam) {
  const source = String(exam?.source_key || "").trim();
  const year = String(exam?.year || "").match(/20\d{2}/)?.[0] || "2026";
  const builtInIds = {
    bac: "bac",
    bac_2026: "bac",
  };

  return builtInIds[source]
    ? `${builtInIds[source]}-${year}`
    : exam?.table_name
      ? `upload-${exam.table_name}`
      : FALLBACK_EXAM_ID;
}

export default function StatisticsRedirectPage() {
  useEffect(() => {
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

  return (
    <main dir="rtl" className="grid min-h-screen place-items-center bg-slate-50 px-5 text-center dark:bg-[#07120c]">
      <section className="w-full max-w-sm rounded-[28px] border border-emerald-100 bg-white p-6 shadow-xl dark:border-white/10 dark:bg-white/[.05]">
        <div className="mx-auto h-10 w-10 animate-spin rounded-full border-4 border-emerald-100 border-t-emerald-600" />
        <h1 className="mt-5 text-lg font-black text-slate-950 dark:text-white">جاري فتح إحصائيات باكالوريا 2026</h1>
        <p className="mt-2 text-sm font-bold text-slate-500 dark:text-slate-300">سيظهر قسم عدد تكرار المعدلات للناجحين تلقائيًا.</p>
      </section>
    </main>
  );
}
