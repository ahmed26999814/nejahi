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

const BAC_PATTERN = /باكالوريا|بكالوريا|baccalaur(?:e|é)at|(^|[^a-z])bac([^a-z]|$)/i;
const NON_BAC_PATTERN = /ابريفه|بريفه|brevet|bepc|كونكور|concours|c1as|الامتياز|excellence/i;

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

function normalizeStream(value) {
  const raw = String(value || "").trim();
  if (!raw) return "";

  const normalized = raw
    .toUpperCase()
    .replace(/[()\[\]{}]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
  const codeMatch = normalized.match(/(?:^|\s|[-–—:/])(SN|LO|LM|TM|TS|LA|M)(?=$|\s|[-–—:/])/);
  const code = codeMatch?.[1] || (STREAM_ALIASES[normalized] ? normalized : "");

  return STREAM_ALIASES[code] || raw;
}

function readBacResultCard() {
  const card = document.querySelector(".result-modal .result-score")?.closest(".result-modal");
  if (!card) return null;

  const average = parseAverage(card.querySelector(".result-score")?.textContent);
  const rawStream = readDetailValue(card, ["الشعبة", "السلسلة", "série", "serie", "filière", "filiere"]);
  const stream = normalizeStream(rawStream);
  const examLabel = readDetailValue(card, ["المسابقة", "الامتحان", "examen", "concours"]);
  const activeLabel = document.querySelector('[aria-current="page"]')?.textContent || "";
  const context = `${window.location.hash} ${activeLabel} ${examLabel} ${card.textContent || ""}`;

  const hasBacLabel = BAC_PATTERN.test(context);
  const hasKnownBacStream = Object.values(STREAM_ALIASES).includes(stream)
    || Object.keys(STREAM_ALIASES).some((code) => rawStream.toUpperCase().includes(code));
  const isClearlyOtherExam = NON_BAC_PATTERN.test(context);
  const looksLikeBacResult = hasBacLabel
    || (hasKnownBacStream && !isClearlyOtherExam && average !== null && average <= 20);

  if (!looksLikeBacResult || average === null || average < 10 || average > 20 || !stream) return null;
  return { average, stream };
}

export default function OrientationResultBridge() {
  const [target, setTarget] = useState(null);
  const [result, setResult] = useState(null);

  useEffect(() => {
    let frame = 0;
    let observer = null;
    let timers = [];

    function sync() {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => {
        const resultCard = document.querySelector(".result-modal .result-score")?.closest(".result-modal") || null;
        const parsed = resultCard ? readBacResultCard() : null;
        setTarget(parsed ? resultCard : null);
        setResult(parsed);
      });
    }

    function scheduleSync() {
      timers.forEach((timer) => window.clearTimeout(timer));
      timers = [0, 80, 240, 600].map((delay) => window.setTimeout(sync, delay));
    }

    function watch() {
      observer?.disconnect();
      const root = document.querySelector("main") || document.body;
      observer = new MutationObserver(sync);
      observer.observe(root, { childList: true, subtree: true, characterData: true });
      scheduleSync();
    }

    function handleRouteChange() {
      setTarget(null);
      setResult(null);
      watch();
    }

    watch();
    window.addEventListener("mauriresults:routechange", handleRouteChange);
    window.addEventListener("hashchange", handleRouteChange);
    window.addEventListener("popstate", handleRouteChange);

    return () => {
      cancelAnimationFrame(frame);
      timers.forEach((timer) => window.clearTimeout(timer));
      observer?.disconnect();
      window.removeEventListener("mauriresults:routechange", handleRouteChange);
      window.removeEventListener("hashchange", handleRouteChange);
      window.removeEventListener("popstate", handleRouteChange);
    };
  }, []);

  if (!target || !result) return null;

  const href = `/orientation?stream=${encodeURIComponent(result.stream)}&average=${encodeURIComponent(result.average.toFixed(2))}`;

  return createPortal(
    <aside data-orientation-result className="mt-3 flex min-w-0 items-center gap-3 rounded-2xl border border-emerald-200 bg-emerald-50/70 p-3 dark:border-emerald-300/20 dark:bg-emerald-300/10">
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
