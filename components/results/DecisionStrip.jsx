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

function brevetMotivationalPhrase(average) {
  if (!Number.isFinite(average) || average < 0 || average > 20) return "";
  if (average >= 15) return "انت مانك متكايس 😎🔥";
  if (average >= 13) return "انت حامي انجحت 💪🔥";
  if (average >= 10) return "نصر انجحت 🎉";
  if (average >= 8.5) return "عيش حياتك انت انجحت 😅";
  if (average >= 7) return "اهم شيء بعد اجبرت تجاوز 😄";
  if (average >= 6) return "بعدنك انجحت 🙂";
  if (average >= 4) return "عادي تجبروا سنة جاي 🤝";
  if (average >= 2) return "ألا حاول تكرا دور تنجح تعكب 📚";
  return "كالتك العنز 🐐";
}

function isBrevetResult(root, source) {
  if (String(source || "").trim().toLowerCase() === "brevet") return true;
  const resultText = String(root?.closest?.(".result-modal")?.textContent || "");
  return /(?:ابريفه|ابريفه|بريفه|BEPC)/i.test(resultText);
}

function parseScore(value) {
  const text = String(value ?? "").trim().replace(",", ".");
  if (!text) return Number.NaN;
  const parsed = Number(text);
  return Number.isFinite(parsed) ? parsed : Number.NaN;
}

function DecisionStrip({ average, label = "القرار", maxScore, source, status }) {
  const tone = TONES[status?.className] || TONES.unknown;
  const rootRef = useRef(null);
  const [phrase, setPhrase] = useState("");
  const [showMotivational, setShowMotivational] = useState(true);

  useEffect(() => {
    const syncVisibility = (event) => {
      if (typeof event?.detail?.visible === "boolean") {
        setShowMotivational(event.detail.visible);
        return;
      }
      setShowMotivational(document.documentElement.dataset.showMotivational !== "false");
    };

    syncVisibility();
    window.addEventListener("mauriresults:motivational-visibility", syncVisibility);
    return () => window.removeEventListener("mauriresults:motivational-visibility", syncVisibility);
  }, []);

  useEffect(() => {
    let nextPhrase = "";

    if (status?.className !== "absent") {
      const scoreNode = rootRef.current?.previousElementSibling;
      const scoreText = String(scoreNode?.textContent || "").trim().replace(",", ".");
      const explicitAverage = parseScore(average);
      const matchedAverage = scoreText.match(/\d+(?:\.\d+)?/);
      const resolvedAverage = Number.isFinite(explicitAverage)
        ? explicitAverage
        : matchedAverage
          ? Number(matchedAverage[0])
          : Number.NaN;
      const resolvedMaxScore = Number(maxScore || (/\/\s*200\b/.test(scoreText) ? 200 : 20));

      if (resolvedMaxScore <= 20) {
        nextPhrase = isBrevetResult(rootRef.current, source)
          ? brevetMotivationalPhrase(resolvedAverage)
          : motivationalPhrase(resolvedAverage);
      }
    }

    setPhrase((current) => current === nextPhrase ? current : nextPhrase);
  });

  return (
    <div ref={rootRef} className="mt-3 grid w-full gap-2">
      <div className={`flex w-full items-center justify-between gap-3 rounded-[22px] border px-4 py-3 shadow-sm ${tone}`} role="status" aria-label={`${label}: ${status?.label || "-"}`}>
        <span className="rounded-full bg-white/60 px-3 py-1 text-xs font-black dark:bg-white/10">{label}</span>
        <strong className="text-xl font-black leading-tight md:text-2xl">{status?.label || "-"}</strong>
      </div>
      {showMotivational && phrase && (
        <p className="rounded-[18px] border border-mauri-gold/25 bg-mauri-gold/10 px-4 py-2 text-center text-sm font-black leading-6 text-amber-800 shadow-sm dark:border-mauri-gold/20 dark:bg-mauri-gold/10 dark:text-amber-200" aria-label="عبارة تحفيزية حسب المعدل">
          {phrase}
        </p>
      )}
    </div>
  );
}

export default memo(DecisionStrip);
