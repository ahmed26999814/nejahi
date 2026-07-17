"use client";

import { useEffect, useMemo, useState } from "react";

const TARGET_TIME = "2026-07-15T18:00:00Z";

function getRemainingTime() {
  const distance = Math.max(0, new Date(TARGET_TIME).getTime() - Date.now());

  return {
    distance,
    hours: Math.floor(distance / (1000 * 60 * 60)),
    minutes: Math.floor((distance / (1000 * 60)) % 60),
    seconds: Math.floor((distance / 1000) % 60),
  };
}

function TimeBox({ label, value }) {
  return (
    <div className="min-w-[74px] rounded-2xl border border-white/20 bg-white/15 px-3 py-2 text-center shadow-sm backdrop-blur-sm">
      <strong className="block text-2xl font-black tabular-nums text-white sm:text-3xl">
        {String(value).padStart(2, "0")}
      </strong>
      <span className="text-[11px] font-bold text-emerald-50">{label}</span>
    </div>
  );
}

export default function ResultsCountdownBanner() {
  const [remaining, setRemaining] = useState(getRemainingTime);

  useEffect(() => {
    const timer = window.setInterval(() => setRemaining(getRemainingTime()), 1000);
    return () => window.clearInterval(timer);
  }, []);

  const finished = remaining.distance <= 0;
  const title = useMemo(
    () => finished
      ? "تم فتح نتائج الكونكور وابريفه 2026"
      : "موعد نشر نتائج الكونكور وابريفه 2026",
    [finished],
  );

  return (
    <section dir="rtl" className="relative z-30 overflow-hidden bg-gradient-to-l from-emerald-800 via-emerald-700 to-teal-700 px-4 py-4 text-white shadow-lg">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(255,255,255,.18),transparent_35%)]" />
      <div className="relative mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 sm:flex-row">
        <div className="text-center sm:text-right">
          <p className="text-xs font-black text-amber-300">إعلان مهم</p>
          <h2 className="mt-1 text-lg font-black sm:text-2xl">{title}</h2>
          <p className="mt-1 text-sm font-semibold text-emerald-50">
            {finished
              ? "يمكنكم الآن البحث عن النتائج عبر منصة MauriResults."
              : "اليوم عند الساعة 18:00 بتوقيت نواكشوط."}
          </p>
        </div>

        {!finished && (
          <div className="flex items-center justify-center gap-2" aria-label="الوقت المتبقي لنشر النتائج">
            <TimeBox label="ساعة" value={remaining.hours} />
            <span className="text-2xl font-black text-amber-300">:</span>
            <TimeBox label="دقيقة" value={remaining.minutes} />
            <span className="text-2xl font-black text-amber-300">:</span>
            <TimeBox label="ثانية" value={remaining.seconds} />
          </div>
        )}
      </div>
    </section>
  );
}
