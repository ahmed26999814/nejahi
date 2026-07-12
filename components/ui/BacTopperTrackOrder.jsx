"use client";

import { useEffect } from "react";

const BAC_TRACK_ORDER = new Map([
  ["SN", 0],
  ["M", 1],
  ["LO", 2],
  ["LM", 3],
]);

function normalizeTrack(value) {
  return String(value || "")
    .trim()
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, "");
}

function applyBacTrackOrder() {
  const groups = document.querySelectorAll(".track-group");

  groups.forEach((group, index) => {
    const track = normalizeTrack(group.querySelector("h3")?.textContent);
    const priority = BAC_TRACK_ORDER.has(track)
      ? BAC_TRACK_ORDER.get(track)
      : BAC_TRACK_ORDER.size + index;

    group.style.order = String(priority);
    group.dataset.trackPriority = String(priority);
  });
}

export default function BacTopperTrackOrder() {
  useEffect(() => {
    let frame = 0;

    const schedule = () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(applyBacTrackOrder);
    };

    schedule();

    const root = document.querySelector("main") || document.body;
    const observer = new MutationObserver(schedule);
    observer.observe(root, { childList: true, subtree: true });
    window.addEventListener("hashchange", schedule);

    return () => {
      cancelAnimationFrame(frame);
      observer.disconnect();
      window.removeEventListener("hashchange", schedule);
    };
  }, []);

  return null;
}
