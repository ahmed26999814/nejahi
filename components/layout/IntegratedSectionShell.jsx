"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

const translations = {
  "الدروس والكتب": "Cours et livres", "حاسبة المعدل": "Calculateur de moyenne", "الرئيسية": "Accueil",
  "الابتدائية": "Primaire", "الإعدادية": "Collège", "الثانوية": "Lycée",
  "كتب المرحلة الابتدائية": "Livres du primaire", "كتب المرحلة الإعدادية": "Livres du collège", "كتب المرحلة الثانوية": "Livres du lycée",
  "السنة الأولى": "1re année", "السنة الثانية": "2e année", "السنة الثالثة": "3e année", "السنة الرابعة": "4e année",
  "السنة الخامسة": "5e année", "السنة السادسة": "6e année", "السنة السابعة (BAC)": "7e année (BAC)",
  "تحميل PDF": "Télécharger PDF", "كتاب التلميذ": "Manuel de l'élève", "دفتر التمارين": "Cahier d'exercices",
  "دفتر الكتابة": "Cahier d'écriture", "كتاب القراءة": "Livre de lecture", "التربية الإسلامية": "Éducation islamique",
  "اللغة العربية": "Arabe", "التربية المدنية": "Éducation civique", "الرياضيات": "Mathématiques",
  "العلوم الطبيعية": "Sciences naturelles", "الجغرافيا": "Géographie", "التاريخ": "Histoire", "الفرنسية": "Français",
  "الإنجليزية": "Anglais", "الفيزياء": "Physique", "الكيمياء": "Chimie", "الفلسفة": "Philosophie",
  "احسب المعدل": "Calculer la moyenne", "المعدل": "Moyenne", "المادة": "Matière", "المعامل": "Coefficient",
  "النتيجة": "Note", "الشعبة المختارة": "Série sélectionnée", "العودة إلى النتائج": "Retour aux résultats",
};

function MoonIcon() {
  return <svg viewBox="0 0 24 24" className="h-5 w-5 fill-none stroke-current stroke-2" aria-hidden="true"><path d="M20 15.5A8.5 8.5 0 0 1 8.5 4 8.5 8.5 0 1 0 20 15.5Z" /></svg>;
}

function SunIcon() {
  return <svg viewBox="0 0 24 24" className="h-5 w-5 fill-none stroke-current stroke-2" aria-hidden="true"><circle cx="12" cy="12" r="4" /><path d="M12 2v2M12 20v2M4.93 4.93l1.42 1.42M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.42-1.42M17.66 6.34l1.41-1.41" /></svg>;
}

function BackIcon({ rtl }) {
  return <svg viewBox="0 0 24 24" className={`h-5 w-5 fill-none stroke-current stroke-2 ${rtl ? "" : "rotate-180"}`} aria-hidden="true"><path d="m15 18-6-6 6-6" /></svg>;
}

export default function IntegratedSectionShell({ active, children }) {
  const [theme, setTheme] = useState("light");
  const [lang, setLang] = useState("ar");

  useEffect(() => {
    const savedTheme = localStorage.getItem("mauriresults-theme") || (matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light");
    const savedLang = localStorage.getItem("mauriresults-lang") || "ar";
    setTheme(savedTheme);
    setLang(savedLang);
  }, []);

  useEffect(() => {
    document.documentElement.classList.toggle("dark", theme === "dark");
    localStorage.setItem("mauriresults-theme", theme);
  }, [theme]);

  useEffect(() => {
    document.documentElement.lang = lang;
    document.documentElement.dir = lang === "ar" ? "rtl" : "ltr";
    localStorage.setItem("mauriresults-lang", lang);

    const translate = () => {
      const root = document.querySelector("[data-integrated-content]");
      if (!root) return;
      const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
      while (walker.nextNode()) {
        const node = walker.currentNode;
        if (!node.__mauriOriginalText) node.__mauriOriginalText = node.nodeValue;
        const original = node.__mauriOriginalText || "";
        const trimmed = original.trim();
        node.nodeValue = lang === "fr" && translations[trimmed] ? original.replace(trimmed, translations[trimmed]) : original;
      }
    };

    translate();
    const root = document.querySelector("[data-integrated-content]");
    const observer = root ? new MutationObserver(() => requestAnimationFrame(translate)) : null;
    if (root) observer.observe(root, { childList: true, subtree: true });
    return () => observer?.disconnect();
  }, [lang]);

  function goBack() {
    if (window.history.length > 1) window.history.back();
    else window.location.href = "/";
  }

  return (
    <div data-integrated-page>
      <header className="sticky top-0 z-50 border-b border-mauri-border/80 bg-white/95 text-slate-900 backdrop-blur-xl dark:border-white/10 dark:bg-[#0b1811]/95 dark:text-white">
        <nav className="app-shell flex h-16 items-center justify-between gap-2">
          <div className="flex min-w-0 items-center gap-2">
            <button onClick={goBack} type="button" className="grid h-10 w-10 shrink-0 place-items-center rounded-2xl border border-slate-200 bg-white text-slate-700 shadow-sm transition active:scale-95 dark:border-white/15 dark:bg-white/10 dark:text-white" aria-label={lang === "ar" ? "رجوع" : "Retour"}>
              <BackIcon rtl={lang === "ar"} />
            </button>
            <Link href="/" className="flex min-w-0 items-center gap-2.5">
              <img src="/logo.png" width="40" height="40" alt="MauriResults" className="h-10 w-10 rounded-[14px] object-cover" />
              <span className="min-w-0"><strong className="block truncate text-sm font-black">MauriResults</strong><small className="block truncate text-[11px] font-bold text-slate-500 dark:text-slate-300">{lang === "ar" ? "منصة النتائج الوطنية" : "Plateforme nationale des résultats"}</small></span>
            </Link>
          </div>

          <div className="flex items-center gap-2">
            <button className="icon-button h-10 w-10 border-slate-200 bg-white text-slate-800 dark:border-white/15 dark:bg-white/10 dark:text-white" type="button" onClick={() => setTheme(theme === "dark" ? "light" : "dark")} aria-label="تبديل الوضع">{theme === "dark" ? <SunIcon /> : <MoonIcon />}</button>
            <button className="lang-button h-10 min-w-12 border-slate-200 bg-white text-slate-800 dark:border-white/15 dark:bg-white/10 dark:text-white" type="button" onClick={() => setLang(lang === "ar" ? "fr" : "ar")}>{lang === "ar" ? "FR" : "AR"}</button>
          </div>
        </nav>
      </header>
      <div data-integrated-content>{children}</div>
    </div>
  );
}
