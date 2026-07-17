"use client";

import { useEffect } from "react";

const TONE_CLASSES = [
  "exam-card-green",
  "exam-card-blue",
  "exam-card-gold",
  "exam-card-teal",
  "exam-card-amber",
  "exam-card-purple",
];

function normalize(text) {
  return String(text || "").replace(/\u200B/g, "").trim();
}

function getYear(title) {
  return title.match(/20\d{2}/)?.[0] || "";
}

function classify(title) {
  const value = title.toLowerCase();
  if (/كونكور|concours|c1as|دخول السنة الأولى/.test(value)) return "concours";
  if (/ابريفه|ابريفه|بريف|bepc|brevet/.test(value)) return "brevet";
  if (/امتياز|excellence/.test(value)) return "excellence";
  if (/تكميلية|session|complémentaire|complementaire/.test(value)) return "session";
  if (/باكالوريا|bac|baccalaureat|baccalauréat/.test(value)) return "bac";
  return "results";
}

function descriptionFor(title, lang) {
  const year = getYear(title);
  const suffixAr = year ? ` لسنة ${year}` : "";
  const suffixFr = year ? ` ${year}` : "";
  const kind = classify(title);

  const descriptions = {
    ar: {
      concours: `ابحث بالولاية والمقاطعة والمركز ورقم المترشح${suffixAr}.`,
      brevet: `نتائج شهادة ختم الدروس الإعدادية الرسمية${suffixAr}.`,
      excellence: `نتائج مسابقة الامتياز الرسمية${suffixAr}.`,
      session: `نتائج الدورة التكميلية للباكالوريا${suffixAr}.`,
      bac: `النتائج الرسمية للباكالوريا${suffixAr}.`,
      results: `النتائج الرسمية المتاحة للبحث${suffixAr}.`,
    },
    fr: {
      concours: `Recherche par région, département, centre et numéro${suffixFr}.`,
      brevet: `Résultats officiels du BEPC${suffixFr}.`,
      excellence: `Résultats officiels du concours d’excellence${suffixFr}.`,
      session: `Résultats de la session complémentaire du Bac${suffixFr}.`,
      bac: `Résultats officiels du baccalauréat${suffixFr}.`,
      results: `Résultats officiels disponibles${suffixFr}.`,
    },
  };

  return descriptions[lang][kind];
}

function toneFor(title) {
  const kind = classify(title);
  if (kind === "concours") return "exam-card-gold";
  if (kind === "brevet") return "exam-card-blue";
  if (kind === "excellence") return "exam-card-teal";
  if (kind === "session") return "exam-card-amber";
  if (kind === "bac") return "exam-card-green";
  return "exam-card-purple";
}

function enhanceCard(card) {
  const titleNode = card.querySelector("strong");
  const descriptionNode = card.querySelector("small");
  if (!titleNode || !descriptionNode) return;

  const title = normalize(titleNode.textContent);
  const currentDescription = normalize(descriptionNode.textContent);
  const lang = document.documentElement.lang?.startsWith("fr") || /Résultats|Concours|Bac|BEPC/i.test(title) ? "fr" : "ar";

  if (!currentDescription || /منشورة من لوحة الأدمن|publiés depuis l'administration/i.test(currentDescription)) {
    descriptionNode.textContent = descriptionFor(title, lang);
  }

  TONE_CLASSES.forEach((className) => card.classList.remove(className));
  card.classList.add(toneFor(title));
  card.dataset.enhancedPublishedCard = "true";
}

function enhanceAll() {
  document.querySelectorAll(".exam-card").forEach(enhanceCard);
}

export default function PublishedExamCardEnhancer() {
  useEffect(() => {
    enhanceAll();
    const observer = new MutationObserver(enhanceAll);
    observer.observe(document.body, { childList: true, subtree: true });
    return () => observer.disconnect();
  }, []);

  return null;
}
