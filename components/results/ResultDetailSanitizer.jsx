"use client";

import { useEffect } from "react";

const SUBJECT_DETAILS_URL = "https://dec.education.gov.mr/";
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

function sanitizeResultDetails() {
  document.querySelectorAll(".info-tile").forEach((tile) => {
    const value = normalize(tile.querySelector("strong")?.textContent);
    const shouldHide = UNAVAILABLE_VALUES.has(value);
    tile.toggleAttribute("hidden", shouldHide);
    tile.setAttribute("aria-hidden", shouldHide ? "true" : "false");
  });
}

function addSubjectDetailsButton() {
  document.querySelectorAll(".result-modal").forEach((card) => {
    if (card.querySelector("[data-subject-details-button]")) return;

    const primaryActions = card.querySelector(".action-button")?.parentElement;
    if (!primaryActions) return;

    const link = document.createElement("a");
    link.href = SUBJECT_DETAILS_URL;
    link.target = "_blank";
    link.rel = "noopener noreferrer";
    link.dataset.subjectDetailsButton = "true";
    link.className = "action-button mt-3 flex min-h-12 w-full items-center justify-center gap-2 rounded-[16px] border border-mauri-green/25 bg-mauri-green/5 px-4 text-sm font-black text-mauri-green transition hover:border-mauri-green/40 hover:bg-mauri-green/10 active:scale-[.98] dark:border-emerald-300/20 dark:bg-emerald-300/10 dark:text-emerald-300";
    link.setAttribute("aria-label", "تفاصيل المواد على موقع إدارة الامتحانات");
    link.innerHTML = '<span aria-hidden="true">📚</span><span>تفاصيل المواد</span><span aria-hidden="true">↗</span>';

    primaryActions.insertAdjacentElement("afterend", link);
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
      timers = [0, 70, 220].map((delay) => window.setTimeout(updateResultCard, delay));
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
