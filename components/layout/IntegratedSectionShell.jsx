"use client";

import Link from "next/link";
import { House, Compass, BookOpen, Calculator, ChartNoAxesCombined } from "lucide-react";
import { useEffect, useState } from "react";

const translations = {
  "الدروس والكتب": "Cours et livres", "حاسبة المعدل": "Calculateur de moyenne", "الرئيسية": "Accueil",
  "احسب المعدل": "Calculer la moyenne", "المعدل": "Moyenne", "المادة": "Matière", "المعامل": "Coefficient",
  "النتيجة": "Note", "الشعبة المختارة": "Série sélectionnée", "العودة إلى النتائج": "Retour aux résultats",
};

const BRAND_LOGO = "/brand-logo.svg?v=green-gold-20260807";

function MoonIcon() { return <svg viewBox="0 0 24 24" className="h-5 w-5 fill-none stroke-current stroke-2" aria-hidden="true"><path d="M20 15.5A8.5 8.5 0 0 1 8.5 4 8.5 8.5 0 1 0 20 15.5Z" /></svg>; }
function SunIcon() { return <svg viewBox="0 0 24 24" className="h-5 w-5 fill-none stroke-current stroke-2" aria-hidden="true"><circle cx="12" cy="12" r="4" /><path d="M12 2v2M12 20v2M4.93 4.93l1.42 1.42M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.42-1.42M17.66 6.34l1.41-1.41" /></svg>; }
function BackIcon({ rtl }) { return <svg viewBox="0 0 24 24" className={`h-5 w-5 fill-none stroke-current stroke-2 ${rtl ? "" : "rotate-180"}`} aria-hidden="true"><path d="m15 18-6-6 6-6" /></svg>; }

export default function IntegratedSectionShell({ children, section = "general" }) {
  const [theme, setTheme] = useState("light");
  const [lang, setLang] = useState("ar");

  useEffect(() => {
    setTheme(localStorage.getItem("mauriresults-theme") || (matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light"));
    setLang(localStorage.getItem("mauriresults-lang") || "ar");
  }, []);

  useEffect(() => {
    document.documentElement.classList.toggle("dark", theme === "dark");
    localStorage.setItem("mauriresults-theme", theme);
  }, [theme]);

  useEffect(() => {
    document.documentElement.lang = lang;
    document.documentElement.dir = lang === "ar" ? "rtl" : "ltr";
    document.documentElement.dataset.lang = lang;
    localStorage.setItem("mauriresults-lang", lang);
    window.dispatchEvent(new CustomEvent("mauriresults:language-change", { detail: { lang } }));

    const root = document.querySelector("[data-integrated-content]");
    if (!root) return;
    const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
    while (walker.nextNode()) {
      const node = walker.currentNode;
      if (node.parentElement?.closest("[data-no-auto-translate]")) continue;
      if (!node.__mauriOriginalText) node.__mauriOriginalText = node.nodeValue;
      const original = node.__mauriOriginalText || "";
      const trimmed = original.trim();
      node.nodeValue = lang === "fr" && translations[trimmed] ? original.replace(trimmed, translations[trimmed]) : original;
    }
  }, [lang]);

  function goBack() {
    // The section header must navigate one card level, not leave the lesson area.
    // Unlike ordinary browser history, this also works for a directly shared deep link.
    if (section === "lessons" && window.location.pathname === "/lessons") {
      const url = new URL(window.location.href);
      const tab = url.searchParams.get("tab") || "lessons";
      let changed = false;
      const clear = (...keys) => keys.forEach(key => url.searchParams.delete(key));
      if (tab === "resources") {
        if (url.searchParams.has("kind")) { clear("kind", "year"); changed = true; }
        else if (url.searchParams.has("subject")) { clear("subject", "year"); changed = true; }
        else if (url.searchParams.has("branch")) { clear("branch", "year"); changed = true; }
        else if (url.searchParams.has("level")) { clear("level", "year"); changed = true; }
        else { clear("tab"); changed = true; }
      } else if (tab === "exams") {
        if (url.searchParams.has("year")) { clear("year"); changed = true; }
        else if (url.searchParams.has("branch")) { clear("branch"); changed = true; }
        else if (url.searchParams.has("competition")) { clear("competition"); changed = true; }
        else { clear("tab"); changed = true; }
      } else if (url.searchParams.has("stage") || url.searchParams.has("grade")) {
        clear("stage", "grade"); changed = true;
      }
      if (changed) {
        window.history.pushState({ ...window.history.state }, "", url.pathname + url.search + url.hash);
        window.dispatchEvent(new PopStateEvent("popstate"));
        return;
      }
    }
    if (window.history.length > 1) window.history.back();
    else window.location.href = "/";
  }

  const sectionLinks = [
    { href: "/", label: lang === "fr" ? "Accueil" : "الرئيسية", icon: House, id: "home" },
    { href: "/orientation", label: lang === "fr" ? "Orientation" : "التوجيه", icon: Compass, id: "orientation" },
    { href: "/lessons", label: lang === "fr" ? "Cours" : "الدروس", icon: BookOpen, id: "lessons" },
    { href: "/calculator", label: lang === "fr" ? "Calculateur" : "الحاسبة", icon: Calculator, id: "calculator" },
    { href: "/statistics", label: lang === "fr" ? "Stats" : "الإحصائيات", icon: ChartNoAxesCombined, id: "statistics" },
  ];

  return (
    <div data-integrated-page data-mauri-section={section} className="mauri-unified-route">
      <header className="sticky top-0 z-50 border-b border-mauri-border/75 bg-white/[.92] text-slate-900 shadow-[0_8px_28px_rgba(15,23,42,.04)] backdrop-blur-2xl dark:border-white/10 dark:bg-[#07130d]/[.92] dark:text-white">
        <nav className="app-shell relative flex h-14 items-center justify-between gap-3" aria-label={lang === "ar" ? "التنقل الرئيسي" : "Navigation principale"}>
          <div className="flex min-w-0 items-center gap-2">
            <button type="button" onClick={goBack} className="grid h-9 w-9 shrink-0 place-items-center rounded-xl border border-mauri-border bg-white text-mauri-green shadow-sm transition active:scale-95 dark:border-white/15 dark:bg-white/10 dark:text-white" aria-label={lang === "ar" ? "رجوع" : "Retour"}><BackIcon rtl={lang === "ar"} /></button>
            <Link href="/" className="flex min-w-0 items-center gap-2.5 rounded-2xl">
              <img src={BRAND_LOGO} alt="MauriResults" width="36" height="36" className="h-9 w-9 shrink-0 rounded-[14px] bg-white object-contain" />
              <span className="min-w-0"><strong className="block truncate text-sm font-black tracking-tight">MauriResults</strong><small className="block truncate text-[11px] font-bold text-slate-500 dark:text-slate-400">{lang === "ar" ? "منصة النتائج الوطنية" : "Plateforme nationale des résultats"}</small></span>
            </Link>
          </div>
          <div className="hidden items-center gap-1 md:flex">
            {sectionLinks.map((item) => (
              <Link key={item.id} href={item.href} aria-current={section === item.id ? "page" : undefined} className={section === item.id ? "nav-link min-h-10 rounded-xl bg-mauri-green px-3 py-2 text-xs font-black text-white" : "nav-link min-h-10 rounded-xl px-3 py-2 text-xs font-black transition hover:bg-mauri-green/10 hover:text-mauri-green"}>{item.label}</Link>
            ))}
          </div>
          <div className="flex shrink-0 items-center gap-1.5">
            <button className="icon-button h-9 w-9 rounded-xl" type="button" onClick={() => setTheme(theme === "dark" ? "light" : "dark")} aria-label={lang === "ar" ? "تبديل الوضع" : "Changer le thème"}>{theme === "dark" ? <SunIcon /> : <MoonIcon />}</button>
            <button className="lang-button min-h-9 rounded-xl" type="button" onClick={() => setLang(lang === "ar" ? "fr" : "ar")} aria-label={lang === "ar" ? "الفرنسية" : "Arabe"}>{lang === "ar" ? "FR" : "AR"}</button>
          </div>
        </nav>
      </header>
      <div data-integrated-content className="pb-24 md:pb-0">{children}</div>
      <nav className="mauri-section-bottom-nav fixed inset-x-0 bottom-0 z-50 mx-auto grid grid-cols-5 items-center gap-1 border border-white/10 bg-[#101e34]/95 px-2 pb-[max(.5rem,env(safe-area-inset-bottom))] pt-2 text-white shadow-[0_-12px_36px_rgba(3,12,23,.18)] backdrop-blur-xl md:hidden" aria-label={lang === "ar" ? "أقسام الموقع" : "Rubriques du site"}>
        {sectionLinks.map((item) => {
          const Icon = item.icon;
          return <Link key={item.id} href={item.href} aria-current={section === item.id ? "page" : undefined} className={section === item.id ? "flex min-h-14 flex-col items-center justify-center gap-1 rounded-2xl bg-mauri-green px-1 py-2 text-center text-[10px] font-black text-white" : "flex min-h-14 flex-col items-center justify-center gap-1 rounded-2xl px-1 py-2 text-center text-[10px] font-black text-slate-200 transition hover:bg-white/10"}><Icon className="h-5 w-5" strokeWidth={2} /><span>{item.label}</span></Link>;
        })}
      </nav>
    </div>
  );
}
