"use client";

import { useEffect } from "react";

const UNAVAILABLE_VALUES = new Set([
  "",
  "غير متوفر",
  "غير متوفرة",
  "غير محدد",
  "غير محددة",
  "non disponible",
  "indisponible",
  "unavailable",
  "undefined",
  "null",
  "-",
]);

function normalize(value) {
  return String(value || "").trim().replace(/\s+/g, " ").toLowerCase();
}

function normalizeDigits(value) {
  return String(value || "")
    .replace(/[٠-٩]/g, (digit) => String("٠١٢٣٤٥٦٧٨٩".indexOf(digit)))
    .replace(/\D/g, "")
    .slice(0, 14);
}

function sanitizeResultDetails() {
  document.querySelectorAll(".info-tile").forEach((tile) => {
    const value = normalize(tile.querySelector("strong")?.textContent);
    const shouldHide = UNAVAILABLE_VALUES.has(value);
    tile.toggleAttribute("hidden", shouldHide);
    tile.setAttribute("aria-hidden", shouldHide ? "true" : "false");
  });
}

function isBepcContext(card) {
  const activeLabel = document.querySelector('[aria-current="page"]')?.textContent || "";
  const context = normalize(`${window.location.hash} ${activeLabel} ${card.textContent || ""}`);
  return /bepc|brevet|البريفيه|ابريفه|أبريفه|بريفه|ختم الدروس الإعدادية/.test(context);
}

function extractCandidateNumber(card) {
  const explicit = card.querySelector("[data-candidate-number]");
  const explicitValue = normalizeDigits(
    explicit?.getAttribute("data-candidate-number") || explicit?.textContent,
  );
  if (explicitValue) return explicitValue;

  for (const tile of card.querySelectorAll(".info-tile")) {
    const label = normalize(
      tile.querySelector("span, small, p, label")?.textContent || tile.getAttribute("aria-label") || "",
    );
    if (/رقم المترشح|رقم الملف|numéro|numero|n° dossier|dossier/.test(label)) {
      const value = normalizeDigits(tile.querySelector("strong")?.textContent || tile.textContent);
      if (value) return value;
    }
  }

  const text = String(card.textContent || "");
  const match = text.match(
    /(?:رقم المترشح|رقم الملف|رقم|numéro|numero|n°\s*dossier|dossier)\s*[:：-]?\s*([0-9٠-٩]{3,14})/i,
  );
  return normalizeDigits(match?.[1]);
}

function addSubjectDetailsButton() {
  document.querySelectorAll(".result-modal").forEach((card) => {
    const existing = card.querySelector("[data-subject-details-button]");

    if (!isBepcContext(card)) {
      existing?.remove();
      return;
    }

    if (existing?.dataset.subjectDetailsVersion === "2") return;
    existing?.remove();

    const primaryActions = card.querySelector(".action-button")?.parentElement;
    if (!primaryActions) return;

    const button = document.createElement("button");
    button.type = "button";
    button.dataset.subjectDetailsButton = "true";
    button.dataset.subjectDetailsVersion = "2";
    button.className =
      "mt-3 flex min-h-[68px] w-full items-center gap-3 overflow-hidden rounded-[20px] border border-emerald-300/35 bg-gradient-to-l from-[#087047] via-emerald-600 to-emerald-500 px-3.5 py-3 text-right text-white shadow-[0_16px_38px_rgba(5,150,105,.30)] outline-none transition hover:-translate-y-0.5 hover:shadow-[0_20px_46px_rgba(5,150,105,.36)] focus:ring-4 focus:ring-emerald-500/25 active:scale-[.98]";
    button.setAttribute("aria-label", "عرض تفاصيل درجات جميع المواد");
    button.innerHTML =
      '<span class="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-white/15 text-xl ring-1 ring-white/20" aria-hidden="true">📚</span><span class="min-w-0 flex-1"><strong class="block text-sm font-black leading-5">تفاصيل المواد</strong><small class="mt-0.5 block text-[10px] font-bold text-emerald-50">عرض درجات جميع المواد</small></span><span class="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-white/12 text-lg font-black" aria-hidden="true">←</span>';
    button.addEventListener("click", () => {
      const number = extractCandidateNumber(card);
      const url = new URL("/bepc-subjects", window.location.origin);
      if (number) url.searchParams.set("number", number);
      window.location.assign(url.toString());
    });

    primaryActions.insertAdjacentElement("beforebegin", button);
  });
}

function updateResultCard() {
  sanitizeResultDetails();
  addSubjectDetailsButton();
}

export default function ResultDetailSanitizer() {
  useEffect(() => {
    let timers = [];

    const schedule = () => {
      timers.forEach((timer) => window.clearTimeout(timer));
      timers = [0, 80, 240, 600].map((delay) => window.setTimeout(updateResultCard, delay));
    };

    schedule();
    window.addEventListener("mauriresults:routechange", schedule);
    window.addEventListener("hashchange", schedule, { passive: true });
    window.addEventListener("popstate", schedule, { passive: true });

    return () => {
      timers.forEach((timer) => window.clearTimeout(timer));
      window.removeEventListener("mauriresults:routechange", schedule);
      window.removeEventListener("hashchange", schedule);
      window.removeEventListener("popstate", schedule);
    };
  }, []);

  return null;
}
