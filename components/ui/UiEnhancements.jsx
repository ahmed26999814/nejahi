"use client";

import { useEffect } from "react";

const BAC_TRACK_PRIORITY = ["SN", "M", "LO", "LM"];

function normalizeTrack(value = "") {
  return value.trim().toUpperCase().replace(/[^A-Z0-9]/g, "");
}

function replaceBrevetLabel(root = document.body) {
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
  const nodes = [];
  while (walker.nextNode()) nodes.push(walker.currentNode);
  nodes.forEach((node) => {
    if (node.nodeValue?.includes("البريفيه")) {
      node.nodeValue = node.nodeValue.replaceAll("البريفيه", "أبريفه");
    }
  });
}

function markAndHideRepeatedPageTitles() {
  document.querySelectorAll("section.app-shell > .page-hero:not(.redundant-section-title)").forEach((hero) => {
    const page = hero.parentElement;
    const title = hero.querySelector("h1")?.textContent?.trim() || "";
    if (page) page.dataset.sectionTitle = title;
    hero.classList.add("redundant-section-title");
  });
}

function enhanceContactPage() {
  const page = [...document.querySelectorAll("section.app-shell")]
    .find((section) => section.dataset.sectionTitle === "اتصل بنا" || section.querySelector("[data-contact-about]"));
  if (!page || page.querySelector("[data-contact-about]")) return;

  const cards = page.querySelector("section.grid.gap-3");
  if (!cards) return;

  const about = document.createElement("section");
  about.dataset.contactAbout = "true";
  about.className = "contact-about-card";
  about.innerHTML = `
    <div class="contact-about-icon" aria-hidden="true">
      <svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="9"></circle><path d="M12 11v5"></path><path d="M12 8h.01"></path></svg>
    </div>
    <div>
      <span class="contact-about-kicker">من نحن</span>
      <h2>MauriResults</h2>
      <p>منصة موريتانية مستقلة تساعد الطلاب وأسرهم على الوصول إلى نتائج المسابقات الوطنية بسرعة ووضوح من الهاتف أو الكمبيوتر.</p>
      <div class="contact-about-points">
        <span>بحث سريع وبسيط</span>
        <span>عرض واضح للنتيجة</span>
        <span>مهيأة للاستخدام على الهاتف</span>
      </div>
    </div>
  `;

  page.insertBefore(about, cards);
  cards.classList.add("contact-methods-grid");
  [...cards.querySelectorAll("a")].forEach((card, index) => {
    card.classList.add("contact-method-card", index === 0 ? "contact-method-whatsapp" : "contact-method-facebook");
  });
}

function enhanceBacToppers() {
  const page = [...document.querySelectorAll("section.app-shell")]
    .find((section) => section.dataset.sectionTitle === "الأوائل" || section.dataset.sectionTitle === "Toppers");
  if (!page) return;

  const examTrigger = page.querySelector(".exam-selector-trigger");
  const selectedExamText = examTrigger?.textContent?.toUpperCase() || "";
  const isBac = selectedExamText.includes("BAC") || selectedExamText.includes("باكالوريا") || selectedExamText.includes("بكالوريا");
  const trackRow = page.querySelector(".stream-filter-row");

  page.classList.toggle("bac-toppers-page", isBac);
  if (!isBac || !trackRow) {
    page.querySelector("[data-track-prompt]")?.remove();
    return;
  }

  const buttons = [...trackRow.querySelectorAll("button.stream-filter-chip")];
  if (!buttons.length) return;

  const allTracksButton = buttons.find((button) => /كل الشعب|toutes|all/i.test(button.textContent || ""));
  if (allTracksButton) {
    allTracksButton.classList.add("all-tracks-hidden");
    allTracksButton.style.order = "999";
  }

  buttons.forEach((button) => {
    if (button === allTracksButton) return;
    const key = normalizeTrack(button.textContent || "");
    const priority = BAC_TRACK_PRIORITY.indexOf(key);
    button.style.order = String(priority === -1 ? 50 : priority);
  });

  const selectedTrackButton = buttons.find((button) => button !== allTracksButton && button.classList.contains("is-active"));
  const contentSection = trackRow.nextElementSibling;
  if (!contentSection) return;

  let prompt = page.querySelector("[data-track-prompt]");
  if (!selectedTrackButton) {
    contentSection.classList.add("toppers-awaiting-track");
    if (!prompt) {
      prompt = document.createElement("section");
      prompt.dataset.trackPrompt = "true";
      prompt.className = "track-choice-prompt";
      prompt.innerHTML = `
        <span class="track-choice-icon" aria-hidden="true">1</span>
        <div>
          <strong>اختر الشعبة أولًا</strong>
          <p>اختر SN أو M أو LO أو LM لعرض الأوائل في الشعبة المحددة.</p>
        </div>
      `;
      trackRow.insertAdjacentElement("afterend", prompt);
    }
  } else {
    contentSection.classList.remove("toppers-awaiting-track");
    prompt?.remove();
  }
}

export default function UiEnhancements() {
  useEffect(() => {
    let frame = 0;
    let timer = 0;

    const apply = () => {
      cancelAnimationFrame(frame);
      clearTimeout(timer);
      frame = requestAnimationFrame(() => {
        replaceBrevetLabel();
        markAndHideRepeatedPageTitles();
        enhanceContactPage();
        enhanceBacToppers();
      });
    };

    const applyAfterNavigation = () => {
      apply();
      timer = window.setTimeout(apply, 120);
    };

    applyAfterNavigation();
    window.addEventListener("hashchange", applyAfterNavigation, { passive: true });
    window.addEventListener("popstate", applyAfterNavigation, { passive: true });
    document.addEventListener("click", applyAfterNavigation, { passive: true, capture: true });

    return () => {
      cancelAnimationFrame(frame);
      clearTimeout(timer);
      window.removeEventListener("hashchange", applyAfterNavigation);
      window.removeEventListener("popstate", applyAfterNavigation);
      document.removeEventListener("click", applyAfterNavigation, true);
    };
  }, []);

  return null;
}
