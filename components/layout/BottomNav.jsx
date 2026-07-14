"use client";

import { useEffect, useState } from "react";
import { AwardIcon, ChartIcon, HomeIcon, SearchIcon } from "../common/icons";

function BookIcon() {
  return <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 5.5A2.5 2.5 0 0 1 6.5 3H11a3 3 0 0 1 3 3v14a3 3 0 0 0-3-3H6.5A2.5 2.5 0 0 0 4 19.5z" /><path d="M20 5.5A2.5 2.5 0 0 0 17.5 3H14v17a3 3 0 0 1 3-3h.5a2.5 2.5 0 0 1 2.5 2.5z" /></svg>;
}

function CalculatorIcon() {
  return <svg viewBox="0 0 24 24" aria-hidden="true"><rect x="4" y="2.5" width="16" height="19" rx="3" /><path d="M8 6.5h8M8 11h1M12 11h1M16 11h1M8 15h1M12 15h1M16 15h1M8 18h1M12 18h5" /></svg>;
}

function MoreIcon() {
  return <svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="5" cy="12" r="1.5" /><circle cx="12" cy="12" r="1.5" /><circle cx="19" cy="12" r="1.5" /></svg>;
}

function MessageIcon() {
  return <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M21 15a4 4 0 0 1-4 4H8l-5 3V7a4 4 0 0 1 4-4h10a4 4 0 0 1 4 4Z" /></svg>;
}

function DownloadIcon() {
  return <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 3v12M7 10l5 5 5-5" /><path d="M5 21h14" /></svg>;
}

export default function BottomNav({ activeView, onNavigate, text }) {
  const [moreOpen, setMoreOpen] = useState(false);
  const isFrench = text?.home === "Accueil";

  const items = [
    { key: "home", label: text.home, view: "home", icon: <HomeIcon /> },
    { key: "search", label: text.search, view: "search", icon: <SearchIcon /> },
    { key: "toppers", label: text.toppers, view: "toppers", icon: <AwardIcon /> },
    { key: "analytics", label: text.analytics, view: "analytics", icon: <ChartIcon /> },
    { key: "more", label: isFrench ? "Plus" : "المزيد", action: "more", icon: <MoreIcon /> },
  ];

  const moreItems = [
    { label: isFrench ? "Cours" : "الدروس", href: "/lessons", icon: <BookIcon />, description: isFrench ? "Cours et révision" : "الدروس والمراجعة" },
    { label: isFrench ? "Calculateur" : "حاسبة المعدل", href: "/calculator", icon: <CalculatorIcon />, description: isFrench ? "Calculer la moyenne" : "احسب معدلك بسرعة" },
    { label: isFrench ? "Contact" : "اتصل بنا", view: "contact", icon: <MessageIcon />, description: isFrench ? "Aide et remarques" : "المساعدة والملاحظات" },
    { label: isFrench ? "Application Android" : "تطبيق أندرويد", href: "/Apk/", icon: <DownloadIcon />, description: isFrench ? "Télécharger l’application" : "تحميل نسخة الهاتف" },
  ];

  useEffect(() => {
    if (!moreOpen) return undefined;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const closeOnEscape = (event) => { if (event.key === "Escape") setMoreOpen(false); };
    window.addEventListener("keydown", closeOnEscape);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", closeOnEscape);
    };
  }, [moreOpen]);

  function activate(item) {
    if (item.action === "more") {
      setMoreOpen(true);
      return;
    }
    if (item.href) {
      window.location.href = item.href;
      return;
    }
    setMoreOpen(false);
    onNavigate(item.view);
  }

  return (
    <>
      <nav className="fixed inset-x-0 bottom-0 z-50 px-2 pb-[max(.5rem,env(safe-area-inset-bottom))] pt-2 md:hidden" aria-label={isFrench ? "Navigation principale" : "التنقل الرئيسي"}>
        <div className="mx-auto grid max-w-md grid-cols-5 gap-1 rounded-[26px] border border-white/75 bg-white/[.94] p-1.5 shadow-[0_-16px_46px_rgba(15,23,42,.13)] backdrop-blur-2xl dark:border-white/10 dark:bg-[#07130d]/[.94]">
          {items.map((item) => {
            const active = item.action === "more"
              ? moreOpen || activeView === "contact"
              : item.view === "search"
                ? activeView === "exam" || activeView === "year"
                : activeView === item.view;
            return (
              <button
                className={`relative grid min-h-12 justify-items-center content-center gap-0.5 rounded-[19px] px-1 py-1.5 text-[9px] font-black leading-tight transition duration-200 active:scale-[.94] ${active ? "bg-mauri-green text-white shadow-[0_8px_20px_rgba(21,128,61,.25)]" : "text-slate-500 hover:bg-mauri-green/10 hover:text-mauri-green dark:text-slate-300"}`}
                onClick={() => activate(item)}
                type="button"
                key={item.key}
                aria-current={active ? "page" : undefined}
                data-control-key={item.key}
                data-haptic
              >
                <span className="grid h-5 w-5 place-items-center [&>svg]:h-5 [&>svg]:w-5">{item.icon}</span>
                <span className="max-w-full truncate" data-control-label>{item.label}</span>
                {active && <span className="absolute -bottom-0.5 h-1 w-5 rounded-full bg-white/85" aria-hidden="true" />}
              </button>
            );
          })}
        </div>
      </nav>

      {moreOpen && (
        <>
          <button className="app-bottom-sheet-backdrop" type="button" aria-label={isFrench ? "Fermer" : "إغلاق"} onClick={() => setMoreOpen(false)} />
          <section className="app-bottom-sheet" role="dialog" aria-modal="true" aria-label={isFrench ? "Plus d’options" : "المزيد من الخيارات"}>
            <div className="app-bottom-sheet-handle" aria-hidden="true" />
            <div className="mb-4 flex items-center justify-between gap-3">
              <div><p className="text-[10px] font-black text-mauri-green dark:text-emerald-300">MauriResults</p><h2 className="mt-1 text-xl font-black text-slate-950 dark:text-white">{isFrench ? "Plus de services" : "خدمات إضافية"}</h2></div>
              <button className="grid h-10 w-10 place-items-center rounded-full bg-slate-100 text-xl font-bold text-slate-600 active:scale-95 dark:bg-white/10 dark:text-white" type="button" onClick={() => setMoreOpen(false)} data-haptic>×</button>
            </div>

            <div className="grid grid-cols-2 gap-2.5">
              {moreItems.map((item) => (
                <button
                  key={item.label}
                  type="button"
                  className="grid min-h-[112px] content-between rounded-[22px] border border-slate-200/80 bg-slate-50 p-3 text-start transition active:scale-[.98] dark:border-white/10 dark:bg-white/[.05]"
                  onClick={() => activate(item)}
                  data-control-key={item.view || (item.href === "/calculator" ? "calculator" : item.href === "/lessons" ? "lessons" : "download")}
                  data-haptic
                >
                  <span className="grid h-10 w-10 place-items-center rounded-2xl bg-mauri-green/10 text-mauri-green [&>svg]:h-5 [&>svg]:w-5 dark:bg-emerald-300/10 dark:text-emerald-300">{item.icon}</span>
                  <span><strong className="block text-sm font-black text-slate-950 dark:text-white">{item.label}</strong><small className="mt-1 block text-[10px] font-bold leading-4 text-slate-500 dark:text-slate-400">{item.description}</small></span>
                </button>
              ))}
            </div>
          </section>
        </>
      )}
    </>
  );
}
