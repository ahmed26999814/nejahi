"use client";

import { useEffect } from "react";

const CACHE_KEY = "mauriresults-site-controls-v2";
const CACHE_TTL_MS = 5 * 60 * 1000;

const DEFAULTS = {
  ui_show_search: "true",
  ui_show_toppers: "true",
  ui_show_analytics: "true",
  ui_show_calculator: "true",
  ui_show_contact: "true",
  ui_show_developer: "true",
  ui_show_footer: "true",
  ui_label_search: "البحث",
  ui_label_toppers: "الأوائل",
  ui_label_analytics: "الإحصائيات",
  ui_label_calculator: "حاسبة المعدل",
  ui_label_contact: "اتصل بنا",
  ui_label_developer: "الإعداد والتطوير",
};

const TERMINOLOGY_REPLACEMENTS = [
  ["البريفيه", "ابريفه"],
  ["أبريفه", "ابريفه"],
  ["BEPC", "Brevet"],
];

function cachedControls() {
  try {
    const parsed = JSON.parse(sessionStorage.getItem(CACHE_KEY) || "null");
    if (parsed?.savedAt && Date.now() - parsed.savedAt < CACHE_TTL_MS) {
      return { ...DEFAULTS, ...(parsed.controls || {}) };
    }
  } catch {}
  return null;
}

async function loadControls(signal) {
  const cached = cachedControls();
  if (cached) return cached;
  try {
    const response = await fetch("/api/site-controls", {
      headers: { Accept: "application/json" },
      signal,
    });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const data = await response.json();
    const controls = { ...DEFAULTS, ...(data.controls || {}) };
    sessionStorage.setItem(CACHE_KEY, JSON.stringify({ controls, savedAt: Date.now() }));
    return controls;
  } catch (error) {
    if (error?.name === "AbortError") throw error;
    return { ...DEFAULTS };
  }
}

function setVisible(element, visible) {
  if (!element) return;
  element.toggleAttribute("hidden", !visible);
  element.setAttribute("aria-hidden", visible ? "false" : "true");
}

function labelFor(key, controls) {
  return controls[`ui_label_${key}`] || DEFAULTS[`ui_label_${key}`] || "";
}

function applyTerminology() {
  document.querySelectorAll("strong, small, h1, h2, h3, p, span, a, button").forEach((element) => {
    if (element.childElementCount > 0) return;
    const current = element.textContent || "";
    const next = TERMINOLOGY_REPLACEMENTS.reduce(
      (value, [from, to]) => value.replaceAll(from, to),
      current,
    );
    if (next !== current) element.textContent = next;
  });
}

function applyControls(controls) {
  const keys = ["search", "toppers", "analytics", "calculator", "contact", "developer"];
  for (const key of keys) {
    const visible = controls[`ui_show_${key}`] !== "false";
    document.querySelectorAll(`[data-control-key="${key}"]`).forEach((element) => {
      setVisible(element, visible);
      const labelNode = element.matches("[data-control-label]") ? element : element.querySelector("[data-control-label]");
      const nextLabel = labelFor(key, controls);
      if (labelNode && nextLabel) labelNode.textContent = nextLabel;
    });
  }

  document.querySelectorAll(".footer-action-contact").forEach((element) => setVisible(element, controls.ui_show_contact !== "false"));
  document.querySelectorAll(".footer-action-developer").forEach((element) => setVisible(element, controls.ui_show_developer !== "false"));
  document.querySelectorAll("footer").forEach((element) => setVisible(element, controls.ui_show_footer !== "false"));
  applyTerminology();
  document.documentElement.dataset.siteControlsReady = "true";
}

export default function UiEnhancements() {
  useEffect(() => {
    const controller = new AbortController();
    let controls = { ...DEFAULTS };
    let timers = [];

    const schedule = () => {
      timers.forEach((timer) => window.clearTimeout(timer));
      timers = [0, 100, 320].map((delay) => window.setTimeout(() => applyControls(controls), delay));
    };

    const refresh = async () => {
      sessionStorage.removeItem(CACHE_KEY);
      controls = await loadControls(controller.signal);
      schedule();
    };

    loadControls(controller.signal).then((value) => {
      controls = value;
      schedule();
    }).catch(() => {});

    window.addEventListener("mauriresults:routechange", schedule);
    window.addEventListener("hashchange", schedule, { passive: true });
    window.addEventListener("popstate", schedule, { passive: true });
    window.addEventListener("mauriresults:site-controls-updated", refresh);

    return () => {
      controller.abort();
      timers.forEach((timer) => window.clearTimeout(timer));
      window.removeEventListener("mauriresults:routechange", schedule);
      window.removeEventListener("hashchange", schedule);
      window.removeEventListener("popstate", schedule);
      window.removeEventListener("mauriresults:site-controls-updated", refresh);
    };
  }, []);

  return null;
}
