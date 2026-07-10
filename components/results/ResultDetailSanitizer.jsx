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

function sanitizeResultDetails(root = document) {
  root.querySelectorAll?.(".info-tile").forEach((tile) => {
    const value = normalize(tile.querySelector("strong")?.textContent);
    const shouldHide = UNAVAILABLE_VALUES.has(value);
    tile.toggleAttribute("hidden", shouldHide);
    tile.setAttribute("aria-hidden", shouldHide ? "true" : "false");
  });
}

export default function ResultDetailSanitizer() {
  useEffect(() => {
    sanitizeResultDetails();
    const observer = new MutationObserver((mutations) => {
      for (const mutation of mutations) {
        if (mutation.type === "childList" || mutation.type === "characterData") {
          sanitizeResultDetails();
          break;
        }
      }
    });
    observer.observe(document.body, { childList: true, subtree: true, characterData: true });
    return () => observer.disconnect();
  }, []);

  return null;
}
