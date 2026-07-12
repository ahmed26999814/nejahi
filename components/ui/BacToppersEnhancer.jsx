"use client";

import { useEffect } from "react";

const TRACKS = {
  SN: { order: 0, meaning: "العلوم الطبيعية" },
  M: { order: 1, meaning: "الرياضيات" },
  LO: { order: 2, meaning: "الآداب الأصلية" },
  LM: { order: 3, meaning: "الآداب العصرية" },
};

function trackCode(value) {
  const normalized = String(value || "")
    .toUpperCase()
    .replace(/[()\[\]{}]/g, " ")
    .replace(/\s+/g, " ")
    .trim();

  return ["SN", "M", "LO", "LM"].find((code) =>
    normalized === code || normalized.startsWith(`${code} `)
  ) || "";
}

function trackLabel(code) {
  return code && TRACKS[code] ? `${code} (${TRACKS[code].meaning})` : "";
}

function isBacToppersPage() {
  const hash = window.location.hash.toLowerCase();
  if (!hash.includes("toppers")) return false;

  const storedExam = localStorage.getItem("mauriresults-selected-exam") || "";
  const selectorText = document.querySelector(".exam-selector-trigger")?.textContent || "";
  const identity = `${storedExam} ${selectorText}`.toLowerCase();

  const isBac = /(^|[^a-z])bac([^a-z]|$)|باكالوريا/.test(identity);
  const isComplementary = /session|compl|تكمي/.test(identity);
  return isBac && !isComplementary;
}

function enhanceTrackGroups() {
  if (!isBacToppersPage()) return;

  const groups = [...document.querySelectorAll(".track-group")];
  if (!groups.length) return;

  for (const group of groups) {
    const heading = group.querySelector("h3");
    const code = trackCode(group.dataset.bacTrackCode || heading?.textContent);
    if (!code) continue;

    group.dataset.bacTrackCode = code;
    if (heading && heading.textContent !== trackLabel(code)) {
      heading.textContent = trackLabel(code);
      heading.title = trackLabel(code);
    }
  }

  const parents = [...new Set(groups.map((group) => group.parentElement).filter(Boolean))];
  for (const parent of parents) {
    const children = [...parent.children].filter((child) => child.classList.contains("track-group"));
    const sorted = [...children].sort((a, b) => {
      const aOrder = TRACKS[a.dataset.bacTrackCode]?.order ?? 99;
      const bOrder = TRACKS[b.dataset.bacTrackCode]?.order ?? 99;
      return aOrder - bOrder;
    });

    const changed = children.some((child, index) => child !== sorted[index]);
    if (changed) sorted.forEach((child) => parent.appendChild(child));
  }
}

function enhanceTrackSelector() {
  if (!isBacToppersPage()) return;

  for (const row of document.querySelectorAll(".stream-filter-row")) {
    const buttons = [...row.querySelectorAll(".stream-filter-chip")];
    const trackButtons = [];

    for (const button of buttons) {
      const code = trackCode(button.dataset.bacTrackCode || button.textContent);
      if (!code) continue;
      button.dataset.bacTrackCode = code;
      button.textContent = trackLabel(code);
      button.title = trackLabel(code);
      trackButtons.push(button);
    }

    const sorted = [...trackButtons].sort(
      (a, b) => TRACKS[a.dataset.bacTrackCode].order - TRACKS[b.dataset.bacTrackCode].order
    );
    sorted.forEach((button) => row.appendChild(button));
  }
}

function updateViewClasses() {
  const hash = window.location.hash.toLowerCase();
  document.documentElement.classList.toggle("view-toppers", hash.includes("toppers"));
  document.documentElement.classList.toggle("view-analytics", hash.includes("analytics"));
}

export default function BacToppersEnhancer() {
  useEffect(() => {
    let frame = 0;

    const refresh = () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => {
        updateViewClasses();
        enhanceTrackGroups();
        enhanceTrackSelector();
      });
    };

    refresh();
    const observer = new MutationObserver(refresh);
    observer.observe(document.body, { childList: true, subtree: true, characterData: true });
    window.addEventListener("hashchange", refresh);
    window.addEventListener("popstate", refresh);

    return () => {
      cancelAnimationFrame(frame);
      observer.disconnect();
      window.removeEventListener("hashchange", refresh);
      window.removeEventListener("popstate", refresh);
      document.documentElement.classList.remove("view-toppers", "view-analytics");
    };
  }, []);

  return null;
}
