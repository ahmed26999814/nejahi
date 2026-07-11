"use client";

import { useEffect } from "react";

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

function enhanceContactPage() {
  const contactHeading = [...document.querySelectorAll("h1")].find((heading) => heading.textContent?.trim() === "اتصل بنا");
  if (!contactHeading) return;

  const page = contactHeading.closest("section.app-shell");
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

export default function UiEnhancements() {
  useEffect(() => {
    const apply = () => {
      replaceBrevetLabel();
      enhanceContactPage();
    };

    apply();
    const observer = new MutationObserver(apply);
    observer.observe(document.body, { childList: true, subtree: true });
    return () => observer.disconnect();
  }, []);

  return null;
}
