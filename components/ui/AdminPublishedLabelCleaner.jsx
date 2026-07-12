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
    const schedule = () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => clean());
    };

    schedule();
    const observer = new MutationObserver(schedule);
    observer.observe(document.body, { childList: true, subtree: true, characterData: true });

    return () => {
      cancelAnimationFrame(frame);
      observer.disconnect();
    };
  }, []);

  return null;
}
