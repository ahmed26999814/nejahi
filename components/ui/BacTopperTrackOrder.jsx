"use client";

import { useEffect } from "react";

const BAC_TRACKS = new Map([
  ["SN", { order: 0, meaning: "العلوم الطبيعية" }],
  ["M", { order: 1, meaning: "الرياضيات" }],
  ["LO", { order: 2, meaning: "الآداب الأصلية" }],
  ["LM", { order: 3, meaning: "الآداب العصرية" }],
]);

const NON_TRACK_EXAM_PATTERN = /bepc|brevet|concours|c1as|كونكور|ابريف|أبريف|بريف/i;
const COMPLEMENTARY_PATTERN = /session|compl|تكمي/i;
const BAC_PATTERN = /(^|[^a-z])bac([^a-z]|$)|baccalaur|باكالوريا/i;

function normalizeTrack(value) {
  const normalized = String(value || "").trim().toUpperCase().replace(/[()\[\]{}]/g, " ").replace(/\s+/g, " ");
  return [...BAC_TRACKS.keys()].find((track) => normalized === track || normalized.startsWith(`${track} `)) || "";
}

function fullTrackLabel(track) {
  const config = BAC_TRACKS.get(track);
  return config ? `${track} (${config.meaning})` : track;
}

function currentExamIdentity() {
  const savedExam = localStorage.getItem("mauriresults-selected-exam") || "";
  const selectedExamText = document.querySelector(".exam-selector-trigger")?.textContent || "";
  const pageHeading = document.querySelector("main h1")?.textContent || "";
  return `${savedExam} ${selectedExamText} ${pageHeading}`.trim();
}

function isNonTrackExam() {
  return NON_TRACK_EXAM_PATTERN.test(currentExamIdentity());
}

function isMainBacExam() {
  const identity = currentExamIdentity();
  return BAC_PATTERN.test(identity) && !NON_TRACK_EXAM_PATTERN.test(identity) && !COMPLEMENTARY_PATTERN.test(identity);
}

function isAnyBacExam() {
  const identity = currentExamIdentity();
  return BAC_PATTERN.test(identity) && !NON_TRACK_EXAM_PATTERN.test(identity);
}

function isTrackControlText(value) {
  return /كل الشعب|حسب الشعب|الشعب|الشعبة|toutes les séries|par série|série|series|track/i.test(String(value || "").trim());
}

function setHidden(element, hidden) {
  if (!element) return;
  element.hidden = hidden;
  element.setAttribute("aria-hidden", hidden ? "true" : "false");
}

function removeNonTrackControls() {
  if (!isNonTrackExam()) return;
  const controls = [...document.querySelectorAll(".stream-filter-chip"), ...document.querySelectorAll('button[role="tab"]')];
  let selectedControlWasHidden = false;
  for (const control of controls) {
    if (!isTrackControlText(control.textContent)) continue;
    selectedControlWasHidden ||= control.getAttribute("aria-selected") === "true" || control.classList.contains("is-active");
    setHidden(control, true);
  }
  if (selectedControlWasHidden) controls.find((control) => !control.hidden && !isTrackControlText(control.textContent))?.click();
}

function removeNonTrackResultDetails() {
  if (!isNonTrackExam()) return;
  document.querySelectorAll(".info-tile").forEach((tile) => {
    const labels = [...tile.querySelectorAll("span")].map((item) => item.textContent || "");
    if (labels.some(isTrackControlText)) setHidden(tile, true);
  });
  document.querySelectorAll(".match-row").forEach((row) => {
    const detail = row.querySelector("span.mt-1");
    if (detail) detail.textContent = String(detail.textContent || "").replace(/\s+-\s+.*$/, "");
  });
  document.querySelectorAll(".topper-compact p").forEach((label) => setHidden(label, true));
}

function candidateScore(card) {
  const value = card.querySelector("div.text-center > strong")?.textContent || "";
  const match = String(value).replace(",", ".").match(/-?\d+(?:\.\d+)?/);
  return match ? Number(match[0]) : 0;
}

function mergeNonTrackTopperGroups() {
  if (!isNonTrackExam() || !window.location.hash.toLowerCase().includes("toppers")) return;
  const groups = [...document.querySelectorAll(".track-group")];
  if (groups.length < 2 || groups[0].dataset.noTrackMerged === "true") return;
  const rankedCards = groups.flatMap((group) => [...group.querySelectorAll(".topper-compact")]).sort((a, b) => candidateScore(b) - candidateScore(a)).slice(0, 3);
  if (!rankedCards.length) return;
  const primaryGroup = groups[0];
  const cardsContainer = primaryGroup.querySelector(":scope > .grid");
  if (!cardsContainer) return;
  setHidden(primaryGroup.querySelector(":scope > div:first-child"), true);
  cardsContainer.replaceChildren(...rankedCards);
  primaryGroup.dataset.noTrackMerged = "true";
  groups.slice(1).forEach((group) => setHidden(group, true));
  const rankNames = ["الأول", "الثاني", "الثالث"];
  rankedCards.forEach((card, index) => {
    card.dataset.globalRank = String(index + 1);
    const badge = card.querySelector("div.min-w-0.flex-1 span");
    if (badge) badge.textContent = rankNames[index];
    const medal = card.querySelector(":scope > span:first-child");
    if (medal) medal.textContent = String(index + 1);
    card.querySelectorAll("p").forEach((label) => setHidden(label, true));
  });
}

function updateBacTrackGroups() {
  if (!isAnyBacExam()) return;
  [...document.querySelectorAll(".track-group")].forEach((group, index) => {
    const heading = group.querySelector("h3");
    const track = normalizeTrack(group.dataset.bacTrack || heading?.textContent);
    if (!track) {
      group.style.order = String(100 + index);
      return;
    }
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

function updateBacTrackSelector() {
  if (!isMainBacExam()) return;
  document.querySelectorAll(".stream-filter-row").forEach((row) => {
    [...row.querySelectorAll(".stream-filter-chip")].forEach((button, index) => {
      const track = normalizeTrack(button.dataset.bacTrack || button.textContent);
      if (!track) {
        button.style.order = isTrackControlText(button.textContent) ? "-1" : String(100 + index);
        return;
      }
      button.dataset.bacTrack = track;
      button.textContent = fullTrackLabel(track);
      button.title = fullTrackLabel(track);
      button.style.order = String(BAC_TRACKS.get(track).order);
    });
  });
}

function updateBacAnalyticsOrder() {
  if (!isAnyBacExam() || !window.location.hash.toLowerCase().includes("analytics")) return;
  const candidates = [...document.querySelectorAll(".analytics-ranking-button"), ...document.querySelectorAll(".analytics-reference-card button")];
  candidates.forEach((button, index) => {
    const labelNode = button.querySelector("strong, span:nth-child(2)");
    const track = normalizeTrack(labelNode?.textContent || button.textContent);
    button.style.order = track ? String(BAC_TRACKS.get(track).order) : String(100 + index);
    if (track && labelNode && labelNode.textContent !== fullTrackLabel(track)) labelNode.textContent = fullTrackLabel(track);
  });
}

function applyExamTrackRules() {
  removeNonTrackControls();
  removeNonTrackResultDetails();
  mergeNonTrackTopperGroups();
  updateBacTrackGroups();
  updateBacTrackSelector();
  updateBacAnalyticsOrder();
}

export default function BacTopperTrackOrder() {
  useEffect(() => {
    let frame = 0;
    let timers = [];
    const schedule = () => {
      cancelAnimationFrame(frame);
      timers.forEach((timer) => window.clearTimeout(timer));
      timers = [0, 90, 280].map((delay) => window.setTimeout(() => {
        frame = requestAnimationFrame(applyExamTrackRules);
      }, delay));
    };

    schedule();
    window.addEventListener("mauriresults:routechange", schedule);
    window.addEventListener("hashchange", schedule, { passive: true });
    window.addEventListener("popstate", schedule, { passive: true });

    return () => {
      cancelAnimationFrame(frame);
      timers.forEach((timer) => window.clearTimeout(timer));
      window.removeEventListener("mauriresults:routechange", schedule);
      window.removeEventListener("hashchange", schedule);
      window.removeEventListener("popstate", schedule);
    };
  }, []);

  return null;
}
