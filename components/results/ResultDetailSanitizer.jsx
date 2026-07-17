"use client";

import { useEffect } from "react";

const UNAVAILABLE_VALUES = new Set([
  "",
  "غير متوفر",
  "غير متوفرة",
  "غير محدد",
  "غير محددة",
  "non disponible",
  "indisponible",
  "unavailable",
  "undefined",
  "null",
  "-",
]);

const VERSE = "﴿ إِنَّ اللَّهَ وَمَلَائِكَتَهُ يُصَلُّونَ عَلَى النَّبِيِّ ۚ يَا أَيُّهَا الَّذِينَ آمَنُوا صَلُّوا عَلَيْهِ وَسَلِّمُوا تَسْلِيمًا ﴾";

function normalize(value) {
  return String(value || "").trim().replace(/\s+/g, " ").toLowerCase();
}

function normalizeDigits(value) {
  return String(value || "")
    .replace(/[٠-٩]/g, (digit) => String("٠١٢٣٤٥٦٧٨٩".indexOf(digit)))
    .replace(/\D/g, "")
    .slice(0, 14);
}

function createVerseCard(scope) {
  const wrapper = document.createElement("div");
  wrapper.dataset.quranVerse = scope;
  wrapper.className = scope === "home" ? "app-shell pt-3" : "mb-3";

  const card = document.createElement("aside");
  card.className =
    "relative overflow-hidden rounded-[24px] border border-amber-300/20 bg-gradient-to-l from-[#06150d] via-[#0b2a1a] to-[#06150d] px-3.5 py-3 text-center text-amber-50 shadow-[0_14px_34px_rgba(0,0,0,.18)] sm:px-5 sm:py-4";
  card.innerHTML = `
    <span class="absolute -left-8 -top-10 h-24 w-24 rounded-full bg-amber-300/10 blur-2xl" aria-hidden="true"></span>
    <span class="absolute -bottom-12 right-6 h-24 w-24 rounded-full bg-emerald-300/10 blur-2xl" aria-hidden="true"></span>
    <div class="relative mx-auto max-w-3xl">
      <span class="mx-auto mb-1.5 grid h-7 w-7 place-items-center rounded-full bg-amber-300/10 text-sm text-amber-200 ring-1 ring-amber-200/20" aria-hidden="true">ﷺ</span>
      <p class="text-[10px] font-bold leading-5 sm:text-xs sm:leading-6">${VERSE}</p>
      <span class="mt-1 block text-[8px] font-black text-emerald-300/75 sm:text-[9px]">سورة الأحزاب — الآية ٥٦</span>
    </div>`;
  wrapper.appendChild(card);
  return wrapper;
}

function addHomepageVerse() {
  const existing = document.querySelector('[data-quran-verse="home"]');
  const isHome = !window.location.hash || window.location.hash === "#home";
  if (!isHome) {
    existing?.remove();
    return;
  }

  if (existing) return;
  const header = document.querySelector("main.app-background > header");
  if (!header) return;
  header.insertAdjacentElement("afterend", createVerseCard("home"));
}

function addResultVerse() {
  const resultShell = document.querySelector(".result-page-shell");
  const resultCard = resultShell?.querySelector(":scope > .result-modal");
  const existing = resultShell?.querySelector('[data-quran-verse="result"]');

  if (!resultShell || !resultCard) {
    existing?.remove();
    return;
  }
  if (existing) return;
  resultCard.insertAdjacentElement("beforebegin", createVerseCard("result"));
}

function sanitizeResultDetails() {
  document.querySelectorAll(".info-tile").forEach((tile) => {
    const value = normalize(tile.querySelector("strong")?.textContent);
    const shouldHide = UNAVAILABLE_VALUES.has(value);
    tile.toggleAttribute("hidden", shouldHide);
    tile.setAttribute("aria-hidden", shouldHide ? "true" : "false");
  });
}

function isBepcContext(card) {
  const activeLabel = document.querySelector('[aria-current="page"]')?.textContent || "";
  const context = normalize(`${window.location.hash} ${activeLabel} ${card.textContent || ""}`);
  return /bepc|brevet|ابريفه|ابريفه|ابريفه|بريفه|ختم الدروس الإعدادية/.test(context);
}

function extractCandidateNumber(card) {
  const explicit = card.querySelector("[data-candidate-number]");
  const explicitValue = normalizeDigits(
    explicit?.getAttribute("data-candidate-number") || explicit?.textContent,
  );
  if (explicitValue) return explicitValue;

  for (const tile of card.querySelectorAll(".info-tile")) {
    const label = normalize(
      tile.querySelector("span, small, p, label")?.textContent || tile.getAttribute("aria-label") || "",
    );
    if (/رقم المترشح|رقم الملف|numéro|numero|n° dossier|dossier/.test(label)) {
      const value = normalizeDigits(tile.querySelector("strong")?.textContent || tile.textContent);
      if (value) return value;
    }
  }

  const text = String(card.textContent || "");
  const match = text.match(
    /(?:رقم المترشح|رقم الملف|رقم|numéro|numero|n°\s*dossier|dossier)\s*[:：-]?\s*([0-9٠-٩]{3,14})/i,
  );
  return normalizeDigits(match?.[1]);
}

function addSubjectDetailsButton() {
  document.querySelectorAll(".result-modal").forEach((card) => {
    const existing = card.querySelector("[data-subject-details-button]");

    if (!isBepcContext(card)) {
      existing?.remove();
      return;
    }

    if (existing?.dataset.subjectDetailsVersion === "2") return;
    existing?.remove();

    const primaryActions = card.querySelector(".action-button")?.parentElement;
    if (!primaryActions) return;

    const button = document.createElement("button");
    button.type = "button";
    button.dataset.subjectDetailsButton = "true";
    button.dataset.subjectDetailsVersion = "2";
    button.className =
      "mt-3 flex min-h-[68px] w-full items-center gap-3 overflow-hidden rounded-[20px] border border-emerald-300/35 bg-gradient-to-l from-[#087047] via-emerald-600 to-emerald-500 px-3.5 py-3 text-right text-white shadow-[0_16px_38px_rgba(5,150,105,.30)] outline-none transition hover:-translate-y-0.5 hover:shadow-[0_20px_46px_rgba(5,150,105,.36)] focus:ring-4 focus:ring-emerald-500/25 active:scale-[.98]";
    button.setAttribute("aria-label", "عرض تفاصيل درجات جميع المواد");
    button.innerHTML =
      '<span class="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-white/15 text-xl ring-1 ring-white/20" aria-hidden="true">📚</span><span class="min-w-0 flex-1"><strong class="block text-sm font-black leading-5">تفاصيل المواد</strong><small class="mt-0.5 block text-[10px] font-bold text-emerald-50">عرض درجات جميع المواد</small></span><span class="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-white/12 text-lg font-black" aria-hidden="true">←</span>';
    button.addEventListener("click", () => {
      const number = extractCandidateNumber(card);
      const url = new URL("/bepc-subjects", window.location.origin);
      if (number) url.searchParams.set("number", number);
      window.location.assign(url.toString());
    });

    primaryActions.insertAdjacentElement("beforebegin", button);
  });
}

function updateInterface() {
  addHomepageVerse();
  addResultVerse();
  sanitizeResultDetails();
  addSubjectDetailsButton();
}

export default function ResultDetailSanitizer() {
  useEffect(() => {
    let timers = [];

    const schedule = () => {
      timers.forEach((timer) => window.clearTimeout(timer));
      timers = [0, 80, 240, 600].map((delay) => window.setTimeout(updateInterface, delay));
    };

    schedule();
    window.addEventListener("mauriresults:routechange", schedule);
    window.addEventListener("hashchange", schedule, { passive: true });
    window.addEventListener("popstate", schedule, { passive: true });

    return () => {
      timers.forEach((timer) => window.clearTimeout(timer));
      document.querySelectorAll("[data-quran-verse]").forEach((element) => element.remove());
      window.removeEventListener("mauriresults:routechange", schedule);
      window.removeEventListener("hashchange", schedule);
      window.removeEventListener("popstate", schedule);
    };
  }, []);

  return null;
}
