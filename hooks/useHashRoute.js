"use client";

import { useEffect, useRef } from "react";

const STATIC_VIEWS = new Set(["analytics", "toppers", "contact", "ranking", "result"]);

export function parseHashRoute(hash, exams = []) {
  const value = String(hash || "").replace(/^#/, "").trim();
  if (!value) return { view: "home", yearId: "year-2025", examId: "" };
  if (/^year-\d{4}$/.test(value)) return { view: "year", yearId: value, examId: "" };
  if (STATIC_VIEWS.has(value)) return { view: value, yearId: "", examId: "" };
  const exam = exams.find((item) => item.id === value);
  if (exam || value.startsWith("upload-")) {
    return { view: "exam", yearId: exam?.year ? `year-${exam.year}` : "", examId: value };
  }
  return { view: "home", yearId: "year-2025", examId: "" };
}

function emitRouteChange(detail) {
  window.dispatchEvent(new CustomEvent("mauriresults:routechange", { detail }));
}

export function writeHashRoute(hash, state = {}, { replace = false } = {}) {
  const cleanHash = String(hash || "").replace(/^#/, "");
  const base = `${window.location.pathname}${window.location.search}`;
  const url = cleanHash ? `${base}#${cleanHash}` : base;
  window.history[replace ? "replaceState" : "pushState"]({ ...state, hash: cleanHash }, "", url);
  emitRouteChange({ ...state, hash: cleanHash, source: "write" });
}

export function useHashRoute(exams, onRoute) {
  const callbackRef = useRef(onRoute);
  callbackRef.current = onRoute;

  useEffect(() => {
    const sync = (event) => {
      const route = parseHashRoute(window.location.hash, exams);
      callbackRef.current(route);
      if (event) emitRouteChange({ ...route, source: event.type });
    };

    sync();
    window.addEventListener("popstate", sync);
    window.addEventListener("hashchange", sync);
    return () => {
      window.removeEventListener("popstate", sync);
      window.removeEventListener("hashchange", sync);
    };
  }, [exams]);
}
