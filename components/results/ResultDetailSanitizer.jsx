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

function sanitizeResultDetails() {
  document.querySelectorAll(".info-tile").forEach((tile) => {
    const value = normalize(tile.querySelector("strong")?.textContent);
    const shouldHide = UNAVAILABLE_VALUES.has(value);
    tile.toggleAttribute("hidden", shouldHide);
    tile.setAttribute("aria-hidden", shouldHide ? "true" : "false");
  });
}

export default function ResultDetailSanitizer() {
  useEffect(() => {
    let timers = [];
    const schedule = () => {
      timers.forEach((timer) => window.clearTimeout(timer));
      timers = [0, 70, 220].map((delay) => window.setTimeout(sanitizeResultDetails, delay));
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
