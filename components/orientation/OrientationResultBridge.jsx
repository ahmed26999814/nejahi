"use client";

import Link from "next/link";
import { GraduationCap } from "lucide-react";
import { useEffect, useState } from "react";
import { createPortal } from "react-dom";

const STREAM_ALIASES = {
  SN: "العلوم الطبيعية",
  M: "الرياضيات",
  LO: "الآداب الأصلية",
  LM: "الآداب العصرية",
  TM: "الشعبة التقنية",
  TS: "الهندسة الكهربائية",
  LA: "اللغات",
};

function parseAverage(value) {
  const parsed = Number.parseFloat(String(value || "").replace(",", "."));
  return Number.isFinite(parsed) ? parsed : null;
}

function readDetailValue(card, labels) {
  const normalizedLabels = labels.map((label) => label.toLocaleLowerCase("fr"));
  for (const tile of card.querySelectorAll(".info-tile")) {
    const label = tile.querySelector(":scope > div > span")?.textContent?.trim().toLocaleLowerCase("fr") || "";
    if (normalizedLabels.some((candidate) => label.includes(candidate))) {
      return tile.querySelector(":scope > div > strong")?.textContent?.trim() || "";
    }
  }
  return "";
}

function readBacResultCard() {
  const card = document.querySelector(".result-modal .result-score")?.closest(".result-modal");
  if (!card) return null;

  const cardText = card.textContent || "";
  const isBac = /باكالوريا|بكالوريا|baccalauréat|\bbac\b/i.test(cardText);
  const average = parseAverage(card.querySelector(".result-score")?.textContent);
  const rawStream = readDetailValue(card, ["الشعبة", "السلسلة", "série", "filière"]);
  const stream = STREAM_ALIASES[rawStream] || rawStream;

  if (!isBac || average === null || average < 10 || !stream) return null;
  return { average, stream };
}

export default function OrientationResultBridge() {
  const [target, setTarget] = useState(null);
  const [result, setResult] = useState(null);

  useEffect(() => {
    let frame = 0;
    let observer = null;

    function sync() {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => {
        const resultCard = document.querySelector(".result-modal .result-score")?.closest(".result-modal") || null;
        const parsed = resultCard ? readBacResultCard() : null;
        setTarget(parsed ? resultCard : null);
        setResult(parsed);
        if (parsed) observer?.disconnect();
      });
    }

    function watch() {
      observer?.disconnect();
      const root = document.querySelector("main") || document.body;
      observer = new MutationObserver(sync);
      observer.observe(root, { childList: true, subtree: true });
      sync();
    }

    function handleRouteChange() {
      setTarget(null);
      setResult(null);
      watch();
    }

    watch();
    window.addEventListener("hashchange", handleRouteChange);
    window.addEventListener("popstate", handleRouteChange);

    return () => {
      cancelAnimationFrame(frame);
      observer?.disconnect();
      window.removeEventListener("hashchange", handleRouteChange);
      window.removeEventListener("popstate", handleRouteChange);
    };
  }, []);

  if (!target || !result) return null;

  const href = `/orientation?stream=${encodeURIComponent(result.stream)}&average=${encodeURIComponent(result.average.toFixed(2))}`;

  return createPortal(
    <aside className="mt-3 flex min-w-0 items-center gap-3 rounded-2xl border border-emerald-200 bg-emerald-50/70 p-3 dark:border-emerald-300/20 dark:bg-emerald-300/10">
      <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-mauri-green text-white">
        <GraduationCap className="h-4.5 w-4.5" />
      </span>
      <div className="min-w-0 flex-1">
        <strong className="block truncate text-sm font-black text-slate-950 dark:text-white">
          التخصصات المناسبة لمعدلك
        </strong>
        <span className="block truncate text-xs font-bold text-slate-500 dark:text-slate-300">
          {result.stream} · {result.average.toFixed(2)}
        </span>
      </div>
      <Link className="inline-flex min-h-9 shrink-0 items-center justify-center rounded-xl bg-mauri-green px-3 text-xs font-black text-white transition active:scale-[.97]" href={href}>
        عرض
      </Link>
    </aside>,
    target,
  );
}
