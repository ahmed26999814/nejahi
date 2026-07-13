"use client";

import { memo, useEffect, useRef, useState } from "react";

const TONES = {
  admis: "border-emerald-500/30 bg-emerald-50 text-emerald-800 dark:border-emerald-400/40 dark:bg-emerald-500/15 dark:text-emerald-100",
  sessionnaire: "border-amber-500/35 bg-amber-50 text-amber-800 dark:border-amber-300/45 dark:bg-amber-400/15 dark:text-amber-100",
  ajourne: "border-red-500/30 bg-red-50 text-red-800 dark:border-red-300/45 dark:bg-red-500/15 dark:text-red-100",
  absent: "border-slate-400/35 bg-slate-100 text-slate-800 dark:border-slate-300/35 dark:bg-slate-400/15 dark:text-slate-100",
  unknown: "border-slate-300/50 bg-slate-50 text-slate-800 dark:border-white/20 dark:bg-white/10 dark:text-white",
};

function motivationalPhrase(average) {
  if (!Number.isFinite(average) || average < 0 || average > 20) return "";
  if (average >= 15) return "انت مانك متكايس 😎🔥";
  if (average >= 13) return "انت حامي انجحت 💪🔥";
  if (average >= 10) return "نصر انجحت 🎉";
  if (average >= 9) return "انت ادكد ماتكرا انت ناجح 😅";
  if (average >= 8) return "اشتمر امع راسك لا تمشي فيه 😄";
  if (average >= 6) return "بعدنك انجحت 🙂";
  if (average >= 4) return "عادي تجبروا سنة جاي 🤝";
  if (average >= 2) return "ألا حاول تكرا دور تنجح تعكب 📚";
  return "كالتك العنز 🐐";
}

function DecisionStrip({ average, label = "القرار", maxScore, status }) {
  const tone = TONES[status?.className] || TONES.unknown;
  const rootRef = useRef(null);
  const [phrase, setPhrase] = useState(() => {
    const numericAverage = Number(String(average ?? "").replace(",", "."));
    return Number(maxScore || 20) <= 20 ? motivationalPhrase(numericAverage) : "";
  });

  useEffect(() => {
    if (status?.className === "absent") {
      setPhrase("");
      return;
    }

    const explicitAverage = Number(String(average ?? "").replace(",", "."));
    if (Number.isFinite(explicitAverage)) {
      setPhrase(Number(maxScore || 20) <= 20 ? motivationalPhrase(explicitAverage) : "");
      return;
    }

    const scoreNode = rootRef.current?.previousElementSibling;
    const scoreText = String(scoreNode?.textContent || "").trim().replace(",", ".");
    if (/\/\s*200\b/.test(scoreText)) {
      setPhrase("");
      return;
    }

    const matchedAverage = scoreText.match(/\d+(?:\.\d+)?/);
    const parsedAverage = matchedAverage ? Number(matchedAverage[0]) : Number.NaN;
    setPhrase(motivationalPhrase(parsedAverage));
  }, [average, maxScore, status?.className]);

  return (
    <div ref={rootRef} className="mt-3 grid w-full gap-2">
      <div className={`flex w-full items-center justify-between gap-3 rounded-[22px] border px-4 py-3 shadow-sm ${tone}`} role="status" aria-label={`${label}: ${status?.label || "-"}`}>
        <span className="rounded-full bg-white/60 px-3 py-1 text-xs font-black dark:bg-white/10">{label}</span>
        <strong className="text-xl font-black leading-tight md:text-2xl">{status?.label || "-"}</strong>
      </div>
      {phrase && (
        <p className="rounded-[18px] border border-mauri-gold/25 bg-mauri-gold/10 px-4 py-2 text-center text-sm font-black leading-6 text-amber-800 shadow-sm dark:border-mauri-gold/20 dark:bg-mauri-gold/10 dark:text-amber-200" aria-label="عبارة تحفيزية حسب المعدل">
          {phrase}
        </p>
      )}
    </div>
  );
}

export default memo(DecisionStrip);
