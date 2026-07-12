"use client";

import { useEffect } from "react";

const BAC_TRACKS = new Map([
  ["SN", { order: 0, meaning: "العلوم الطبيعية" }],
  ["M", { order: 1, meaning: "الرياضيات" }],
  ["LO", { order: 2, meaning: "الآداب الأصلية" }],
  ["LM", { order: 3, meaning: "الآداب العصرية" }],
]);

function normalizeTrack(value) {
  const normalized = String(value || "")
    .trim()
    .toUpperCase()
    .replace(/[()\[\]{}]/g, " ")
    .replace(/\s+/g, " ");

  return [...BAC_TRACKS.keys()].find((track) =>
    normalized === track || normalized.startsWith(`${track} `)
  ) || "";
}

function fullTrackLabel(track) {
  const config = BAC_TRACKS.get(track);
  return config ? `${track} (${config.meaning})` : track;
}

function isBacToppersView() {
  if (!window.location.hash.toLowerCase().includes("toppers")) return false;

  const savedExam = localStorage.getItem("mauriresults-selected-exam") || "";
  const selectedExamText = document.querySelector(".exam-selector-trigger")?.textContent || "";
  const identity = `${savedExam} ${selectedExamText}`.toLowerCase();

  const isBac = /(^|[^a-z])bac([^a-z]|$)|باكالوريا/.test(identity);
  const isComplementary = /session|compl|تكمي/.test(identity);
  return isBac && !isComplementary;
}

function updateTrackGroups() {
  if (!isBacToppersView()) return;

  const groups = [...document.querySelectorAll(".track-group")];
  groups.forEach((group, index) => {
    const heading = group.querySelector("h3");
    const track = normalizeTrack(group.dataset.bacTrack || heading?.textContent);
    if (!track) return;

    const config = BAC_TRACKS.get(track);
    group.dataset.bacTrack = track;
    group.style.order = String(config.order);
    group.dataset.trackPriority = String(config.order);

    const label = fullTrackLabel(track);
    if (heading && heading.textContent !== label) {
      heading.textContent = label;
      heading.title = label;
    }
  });
}

function updateTrackSelector() {
  if (!isBacToppersView()) return;

  document.querySelectorAll(".stream-filter-row").forEach((row) => {
    const buttons = [...row.querySelectorAll(".stream-filter-chip")];
    const trackButtons = [];

    buttons.forEach((button) => {
      const track = normalizeTrack(button.dataset.bacTrack || button.textContent);
      if (!track) return;

      button.dataset.bacTrack = track;
      button.textContent = fullTrackLabel(track);
      button.title = fullTrackLabel(track);
      button.style.order = String(BAC_TRACKS.get(track).order + 1);
      trackButtons.push(button);
    });

    buttons
      .filter((button) => !button.dataset.bacTrack)
      .forEach((button) => {
        button.style.order = "0";
      });

    trackButtons
      .sort((a, b) => BAC_TRACKS.get(a.dataset.bacTrack).order - BAC_TRACKS.get(b.dataset.bacTrack).order)
      .forEach((button) => row.appendChild(button));
  });
}

function applyBacTrackEnhancements() {
  updateTrackGroups();
  updateTrackSelector();
}

export default function BacTopperTrackOrder() {
  useEffect(() => {
    let frame = 0;

    const schedule = () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(applyBacTrackEnhancements);
    };

    schedule();

    const root = document.querySelector("main") || document.body;
    const observer = new MutationObserver(schedule);
    observer.observe(root, { childList: true, subtree: true });
    window.addEventListener("hashchange", schedule);
    window.addEventListener("popstate", schedule);

    return () => {
      cancelAnimationFrame(frame);
      observer.disconnect();
      window.removeEventListener("hashchange", schedule);
      window.removeEventListener("popstate", schedule);
    };
  }, []);

  return null;
}
