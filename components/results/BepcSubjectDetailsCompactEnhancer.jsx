"use client";

import { useEffect } from "react";

const ARABIC_DIGITS = /[٠-٩]/g;
const HIDDEN_LABELS = new Set(["جيد", "قريب من النجاح", "يحتاج تحسين", "غير محتسب"]);

function toLatinDigits(value) {
  return String(value || "").replace(ARABIC_DIGITS, (digit) =>
    String("٠١٢٣٤٥٦٧٨٩".indexOf(digit)),
  );
}

function enhanceSubjectModal() {
  const dialog = document.querySelector('[aria-labelledby="subject-details-title"]');
  if (!dialog) return;

  dialog.setAttribute("data-compact-subject-details", "true");

  dialog.querySelectorAll("span").forEach((element) => {
    const text = element.textContent?.trim();
    if (HIDDEN_LABELS.has(text)) element.setAttribute("hidden", "");
  });

  const walker = document.createTreeWalker(dialog, NodeFilter.SHOW_TEXT);
  const textNodes = [];
  while (walker.nextNode()) textNodes.push(walker.currentNode);

  textNodes.forEach((node) => {
    const nextValue = toLatinDigits(node.nodeValue);
    if (nextValue !== node.nodeValue) node.nodeValue = nextValue;
  });
}

export default function BepcSubjectDetailsCompactEnhancer() {
  useEffect(() => {
    let queued = false;
    const run = () => {
      if (queued) return;
      queued = true;
      window.requestAnimationFrame(() => {
        queued = false;
        enhanceSubjectModal();
      });
    };

    run();
    const observer = new MutationObserver(run);
    observer.observe(document.body, { childList: true, subtree: true, characterData: true });

    return () => observer.disconnect();
  }, []);

  return (
    <style jsx global>{`
      [data-compact-subject-details="true"] > header {
        padding-bottom: 0.55rem !important;
        padding-left: 0.65rem !important;
        padding-right: 0.65rem !important;
      }

      [data-compact-subject-details="true"] > header > div:first-child {
        gap: 0.5rem !important;
      }

      [data-compact-subject-details="true"] > header > div:first-child > div:first-child > span,
      [data-compact-subject-details="true"] > header > div:first-child > button {
        width: 2.25rem !important;
        height: 2.25rem !important;
        border-radius: 0.8rem !important;
      }

      [data-compact-subject-details="true"] form {
        margin-top: 0.5rem !important;
      }

      [data-compact-subject-details="true"] form input,
      [data-compact-subject-details="true"] form button {
        min-height: 2.65rem !important;
      }

      [data-compact-subject-details="true"] main > div {
        padding: 0 !important;
      }

      [data-compact-subject-details="true"] main section {
        border-radius: 0 !important;
        border-left: 0 !important;
        border-right: 0 !important;
        box-shadow: none !important;
      }

      [data-compact-subject-details="true"] main section > div:first-child {
        display: none !important;
      }

      [data-compact-subject-details="true"] main section > div:nth-child(2) {
        padding: 0.55rem 0.75rem !important;
      }

      [data-compact-subject-details="true"] main section > div:nth-child(2) p {
        display: none !important;
      }

      [data-compact-subject-details="true"] main section > div:nth-child(2) h4 {
        font-size: 0.95rem !important;
        line-height: 1.2rem !important;
      }

      [data-compact-subject-details="true"] article {
        min-height: 3.35rem !important;
        grid-template-columns: minmax(0, 1fr) 3.6rem !important;
        gap: 0.5rem !important;
        padding: 0.35rem 0.75rem !important;
      }

      [data-compact-subject-details="true"] article > div:first-child {
        gap: 0.45rem !important;
      }

      [data-compact-subject-details="true"] article h5 {
        font-size: 0.78rem !important;
        line-height: 1rem !important;
      }

      [data-compact-subject-details="true"] article h5 + div {
        margin-top: 0.1rem !important;
        gap: 0.35rem !important;
        font-size: 0.62rem !important;
        line-height: 0.8rem !important;
      }

      [data-compact-subject-details="true"] article h5 + div span {
        padding-top: 0.05rem !important;
        padding-bottom: 0.05rem !important;
      }

      [data-compact-subject-details="true"] article > div:last-child > span {
        min-width: 3.25rem !important;
        border-radius: 0.7rem !important;
        padding: 0.3rem 0.2rem !important;
        font-size: 0.78rem !important;
      }

      [data-compact-subject-details="true"] article > div:last-child small {
        margin-top: 0 !important;
        font-size: 0.55rem !important;
      }

      [data-compact-subject-details="true"] main section > p:last-child {
        padding: 0.45rem 0.75rem !important;
        font-size: 0.58rem !important;
        line-height: 0.85rem !important;
      }
    `}</style>
  );
}
