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

    if (existing?.tagName === "BUTTON") return;
    existing?.remove();

    const primaryActions = card.querySelector(".action-button")?.parentElement;
    if (!primaryActions) return;

    const button = document.createElement("button");
    button.type = "button";
    button.dataset.subjectDetailsButton = "true";
    button.className =
      "action-button mt-3 flex min-h-12 w-full items-center justify-center gap-2 rounded-[16px] border border-mauri-green/25 bg-mauri-green/5 px-4 text-sm font-black text-mauri-green transition hover:border-mauri-green/40 hover:bg-mauri-green/10 active:scale-[.98] dark:border-emerald-300/20 dark:bg-emerald-300/10 dark:text-emerald-300";
    button.setAttribute("aria-label", "فتح صفحة تفاصيل مواد البريفيه");
    button.innerHTML =
      '<span aria-hidden="true">📚</span><span>تفاصيل المواد</span><span aria-hidden="true">←</span>';
    button.addEventListener("click", () => {
      const number = extractCandidateNumber(card);
      const url = new URL("/bepc-subjects", window.location.origin);
      if (number) url.searchParams.set("number", number);
      window.location.assign(url.toString());
    });

    primaryActions.insertAdjacentElement("afterend", button);
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
