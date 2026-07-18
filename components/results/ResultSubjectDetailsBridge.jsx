"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";

const SUBJECT_FIELDS = [
  { keys: ["ARABE", "ARABIC", "AR", "العربية", "لغة عربية"], ar: "العربية", fr: "Arabe" },
  { keys: ["FRANCAIS", "FRANÇAIS", "FRENCH", "FR", "الفرنسية"], ar: "الفرنسية", fr: "Français" },
  { keys: ["CALCUL", "MATHEMATIQUES", "MATHÉMATIQUES", "MATH", "MATHS", "الرياضيات", "الحساب"], ar: "الرياضيات", fr: "Mathématiques" },
  { keys: ["PHYSIQUE", "PHYSICS", "PHY", "الفيزياء"], ar: "الفيزياء", fr: "Physique" },
  { keys: ["CHIMIE", "CHEMISTRY", "CHI", "الكيمياء"], ar: "الكيمياء", fr: "Chimie" },
  { keys: ["SCIENCES", "SCIENCE", "SN", "SCIENCES NATURELLES", "العلوم الطبيعية", "العلوم"], ar: "العلوم الطبيعية", fr: "Sciences naturelles" },
  { keys: ["ANGLAIS", "ENGLISH", "ANG", "الإنجليزية"], ar: "الإنجليزية", fr: "Anglais" },
  { keys: ["HISTOIRE", "HISTORY", "HIS", "التاريخ"], ar: "التاريخ", fr: "Histoire" },
  { keys: ["GEOGRAPHIE", "GÉOGRAPHIE", "GEOGRAPHY", "GEO", "الجغرافيا"], ar: "الجغرافيا", fr: "Géographie" },
  { keys: ["PHILOSOPHIE", "PHILOSOPHY", "PHI", "الفلسفة"], ar: "الفلسفة", fr: "Philosophie" },
  { keys: ["EDUCATION ISLAMIQUE", "ISLAMIQUE", "IMR", "التربية الإسلامية", "الإسلامية"], ar: "التربية الإسلامية", fr: "Éducation islamique" },
  { keys: ["INFORMATIQUE", "INFORMATICS", "COMPUTER", "المعلوماتية"], ar: "المعلوماتية", fr: "Informatique" },
];

function normalizeKey(value) {
  return String(value || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[._\-\/\\()]+/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .toUpperCase();
}

function cleanValue(value) {
  if (value == null || typeof value === "object") return "";
  const text = String(value).trim();
  return !text || /^(null|undefined|nan)$/i.test(text) ? "" : text;
}

function candidateIds(row) {
  return [
    row?.id,
    row?.Numero,
    row?.["Numéro"],
    row?.Num_Bepc,
    row?.Num_Excellence_1AS,
    row?.["Numéro_C1AS"],
    row?.Numero_C1AS,
    row?.NODOSS,
  ].map((value) => String(value || "").trim()).filter(Boolean);
}

function currentStudent() {
  try {
    return JSON.parse(sessionStorage.getItem("mauriresults-selected-result") || "null");
  } catch {
    return null;
  }
}

function rawStudent(student) {
  if (!student || !(window.__mauriResultRows instanceof Map)) return null;
  const source = String(student.source || "");
  for (const id of candidateIds(student)) {
    const exact = window.__mauriResultRows.get(`${source}:${id}`);
    if (exact) return exact;
    const fallback = window.__mauriResultRows.get(`*:${id}`);
    if (fallback) return fallback;
  }
  return null;
}

function subjectDetails(student, raw, lang) {
  const merged = {
    ...(raw || {}),
    ...(student || {}),
    ARABE: student?.arabicMark ?? raw?.ARABE,
    FRANCAIS: student?.frenchMark ?? raw?.FRANCAIS,
    CALCUL: student?.mathMark ?? raw?.CALCUL,
  };
  const entries = Object.entries(merged);
  const used = new Set();
  const details = [];

  for (const subject of SUBJECT_FIELDS) {
    const aliases = new Set(subject.keys.map(normalizeKey));
    const match = entries.find(([key, value]) => aliases.has(normalizeKey(key)) && cleanValue(value));
    if (!match) continue;
    const label = lang === "fr" ? subject.fr : subject.ar;
    if (used.has(label)) continue;
    used.add(label);
    details.push({ label, value: cleanValue(match[1]) });
  }

  if (Array.isArray(student?.subjectDetails)) {
    for (const item of student.subjectDetails) {
      const label = cleanValue(item?.label || item?.name);
      const value = cleanValue(item?.value || item?.mark);
      if (!label || !value || used.has(label)) continue;
      used.add(label);
      details.push({ label, value });
    }
  }

  return details;
}

function isAbrevaStudent(student) {
  const identity = `${student?.source || ""} ${student?.sessionType || ""}`.toLowerCase();
  return identity === "brevet" || identity.includes("brevet") || identity.includes("bepc") || identity.includes("أبريفه") || identity.includes("ابريفه") || identity.includes("البريفيه");
}

function hideOldSubjectTiles(labels) {
  const normalized = new Set(labels.map(normalizeKey));
  document.querySelectorAll(".result-details-grid > *").forEach((tile) => {
    const label = tile.querySelector("span:nth-of-type(2)")?.textContent || tile.textContent || "";
    if (normalized.has(normalizeKey(label))) tile.style.display = "none";
  });
}

function repairAbrevaLabels() {
  const replacements = new Map([
    ["نتائج ابريفه 2025", "أبريفه 2025"],
    ["ابريفه 2025", "أبريفه 2025"],
    ["نتائج البريفيه 2026", "أبريفه 2026"],
    ["نتائج البريفيه", "أبريفه"],
    ["البريفيه", "أبريفه"],
  ]);

  document.querySelectorAll("h1,h2,h3,strong,p,span,small").forEach((element) => {
    if (element.children.length) return;
    const text = element.textContent?.trim();
    const replacement = replacements.get(text);
    if (replacement && replacement !== text) element.textContent = replacement;
  });
}

export default function ResultSubjectDetailsBridge() {
  const [target, setTarget] = useState(null);
  const [details, setDetails] = useState([]);
  const [lang, setLang] = useState("ar");
  const [abrevaNumber, setAbrevaNumber] = useState("");

  useEffect(() => {
    let frame = 0;

    function refresh() {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => {
        repairAbrevaLabels();
        const grid = document.querySelector(".result-modal .result-details-grid");
        if (!grid) {
          setTarget(null);
          setDetails([]);
          setAbrevaNumber("");
          return;
        }

        let mount = document.getElementById("mauri-subject-details-mount");
        if (!mount) {
          mount = document.createElement("div");
          mount.id = "mauri-subject-details-mount";
          grid.insertAdjacentElement("afterend", mount);
        }

        const nextLang = localStorage.getItem("mauriresults-lang") === "fr" ? "fr" : "ar";
        const student = currentStudent();
        const nextDetails = subjectDetails(student, rawStudent(student), nextLang);
        const number = isAbrevaStudent(student) ? candidateIds(student)[0] || "" : "";
        hideOldSubjectTiles(nextDetails.map((item) => item.label));
        setLang(nextLang);
        setTarget(mount);
        setDetails(nextDetails);
        setAbrevaNumber(number);
      });
    }

    const observer = new MutationObserver(refresh);
    observer.observe(document.body, { childList: true, subtree: true, characterData: true });
    window.addEventListener("mauriresults:raw-result", refresh);
    window.addEventListener("mauriresults:language-change", refresh);
    window.addEventListener("hashchange", refresh);
    refresh();

    return () => {
      cancelAnimationFrame(frame);
      observer.disconnect();
      window.removeEventListener("mauriresults:raw-result", refresh);
      window.removeEventListener("mauriresults:language-change", refresh);
      window.removeEventListener("hashchange", refresh);
    };
  }, []);

  if (!target || (!details.length && !abrevaNumber)) return null;

  return createPortal(
    <section className="mt-4 rounded-[24px] border border-mauri-green/15 bg-mauri-green/[.04] p-4 dark:border-emerald-300/15 dark:bg-emerald-300/[.05]" aria-label={lang === "fr" ? "Détails des matières" : "تفاصيل المواد"}>
      {abrevaNumber ? (
        <a
          className="flex min-h-14 items-center justify-between gap-3 rounded-[18px] bg-gradient-to-l from-mauri-green via-emerald-600 to-emerald-500 px-4 py-3 text-white shadow-[0_14px_30px_rgba(21,128,61,.22)] transition active:scale-[.98]"
          href={`/bepc-subjects?number=${encodeURIComponent(abrevaNumber)}`}
        >
          <span className="min-w-0">
            <strong className="block text-sm font-black">{lang === "fr" ? "Détails des matières" : "تفاصيل المواد"}</strong>
            <small className="mt-1 block text-[10px] font-bold text-white/80">{lang === "fr" ? "Afficher les notes officielles" : "عرض درجات المواد الرسمية"}</small>
          </span>
          <span className="grid h-10 w-10 shrink-0 place-items-center rounded-[14px] bg-white/15 text-xl" aria-hidden="true">📚</span>
        </a>
      ) : null}

      {details.length ? (
        <div className={abrevaNumber ? "mt-4" : ""}>
          <div className="mb-3 flex items-center justify-between gap-2">
            <h3 className="text-sm font-black text-slate-950 dark:text-white">{lang === "fr" ? "Détails des matières" : "تفاصيل المواد"}</h3>
            <span className="rounded-full bg-mauri-green/10 px-2.5 py-1 text-[10px] font-black text-mauri-green dark:text-emerald-300">{details.length}</span>
          </div>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
            {details.map((item) => (
              <article className="rounded-[18px] border border-white/70 bg-white/[.78] p-3 shadow-soft dark:border-white/10 dark:bg-white/[.06]" key={item.label}>
                <span className="block text-[11px] font-black text-slate-500 dark:text-slate-400">{item.label}</span>
                <strong className="mt-1 block text-lg font-black text-mauri-green dark:text-mauri-gold">{item.value}</strong>
              </article>
            ))}
          </div>
        </div>
      ) : null}
    </section>,
    target
  );
}
