"use client";

import Link from "next/link";
import { ArrowLeft, GraduationCap, Sparkles } from "lucide-react";
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
      });
    }

    function watch() {
      observer?.disconnect();
      sync();
      const root = document.querySelector("main") || document.body;
      observer = new MutationObserver(sync);
      observer.observe(root, { childList: true, subtree: true });
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
    <aside className="mt-4 overflow-hidden rounded-[24px] border border-emerald-200 bg-gradient-to-l from-emerald-50 to-white p-4 shadow-soft dark:border-emerald-300/20 dark:from-emerald-300/10 dark:to-white/5">
      <div className="flex items-start gap-3">
        <span className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-mauri-green text-white">
          <GraduationCap className="h-5 w-5" />
        </span>
        <div className="min-w-0 flex-1">
          <span className="inline-flex items-center gap-1 text-[11px] font-black text-mauri-green dark:text-emerald-300">
            <Sparkles className="h-3.5 w-3.5" />
            الخطوة التالية
          </span>
          <h3 className="mt-1 text-lg font-black text-slate-950 dark:text-white">شاهد التخصصات المناسبة لمعدلك</h3>
          <p className="mt-1 text-xs font-bold leading-5 text-slate-600 dark:text-slate-300">
            سنستخدم شعبة {result.stream} ومعدلك {result.average.toFixed(2)} لعرض فرص التوجيه الأقرب إليك.
          </p>
        </div>
      </div>
      <Link className="mt-4 inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-2xl bg-mauri-green px-4 text-sm font-black text-white shadow-[0_14px_30px_rgba(21,128,61,.22)] transition hover:bg-emerald-700 active:scale-[.98]" href={href}>
        فتح دليل التوجيه
        <ArrowLeft className="h-4 w-4 rotate-180" />
      </Link>
    </aside>,
    target,
  );
}
