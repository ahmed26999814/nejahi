"use client";

import { useEffect } from "react";

const PATTERNS = [
  /نتائج\s+منشورة\s+من\s+(?:لوحة|صفحة)\s+(?:الأدمن|الادمن)/i,
  /résultats\s+publiés?.*administr/i,
];

function clean(root = document.body) {
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
  const matches = [];
  while (walker.nextNode()) {
    const node = walker.currentNode;
    const text = node.nodeValue?.trim() || "";
    if (PATTERNS.some((pattern) => pattern.test(text))) matches.push(node);
  }

  for (const node of matches) {
    const element = node.parentElement;
    if (!element) continue;
    const removable = element.closest("p, small, span") || element;
    removable.style.setProperty("display", "none", "important");
    removable.setAttribute("aria-hidden", "true");
  }
}

export default function AdminPublishedLabelCleaner() {
  useEffect(() => {
    let frame = 0;
    let attempts = 0;
    let timer = 0;

    const schedule = () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => clean());
    };

    const retry = () => {
      schedule();
      attempts += 1;
      if (attempts < 8) timer = window.setTimeout(retry, 500);
    };

    const onNavigation = () => {
      attempts = 0;
      clearTimeout(timer);
      retry();
    };

    retry();
    window.addEventListener("hashchange", onNavigation, { passive: true });
    window.addEventListener("popstate", onNavigation, { passive: true });
    window.addEventListener("mauriresults:exams-updated", onNavigation);

    return () => {
      cancelAnimationFrame(frame);
      clearTimeout(timer);
      window.removeEventListener("hashchange", onNavigation);
      window.removeEventListener("popstate", onNavigation);
      window.removeEventListener("mauriresults:exams-updated", onNavigation);
    };
  }, []);

  return null;
}
