"use client";

import { useEffect } from "react";
import { AwardIcon, ChartIcon, HomeIcon, SearchIcon } from "../common/icons";

function BookIcon() {
  return <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 5.5A2.5 2.5 0 0 1 6.5 3H11a3 3 0 0 1 3 3v14a3 3 0 0 0-3-3H6.5A2.5 2.5 0 0 0 4 19.5z" /><path d="M20 5.5A2.5 2.5 0 0 0 17.5 3H14v17a3 3 0 0 1 3-3h.5a2.5 2.5 0 0 1 2.5 2.5z" /></svg>;
}

function CalculatorIcon() {
  return <svg viewBox="0 0 24 24" aria-hidden="true"><rect x="4" y="2.5" width="16" height="19" rx="3" /><path d="M8 6.5h8M8 11h1M12 11h1M16 11h1M8 15h1M12 15h1M16 15h1M8 18h1M12 18h5" /></svg>;
}

function MessageIcon() {
  return <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M21 15a4 4 0 0 1-4 4H8l-5 3V7a4 4 0 0 1 4-4h10a4 4 0 0 1 4 4Z" /></svg>;
}

function DownloadIcon() {
  return <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 3v12M7 10l5 5 5-5" /><path d="M5 21h14" /></svg>;
}

export default function BottomNav({ activeView, onNavigate, text }) {
  const isFrench = text?.home === "Accueil";

  const primaryItems = [
    { key: "home", label: text.home, view: "home", icon: <HomeIcon /> },
    { key: "search", label: text.search, view: "search", icon: <SearchIcon /> },
    { key: "toppers", label: text.toppers, view: "toppers", icon: <AwardIcon /> },
    { key: "analytics", label: text.analytics, view: "analytics", icon: <ChartIcon /> },
  ];

  const serviceItems = [
    { key: "lessons", label: isFrench ? "Cours" : "الدروس", href: "/lessons", icon: <BookIcon /> },
    { key: "calculator", label: isFrench ? "Calculateur" : "الحاسبة", href: "/calculator", icon: <CalculatorIcon /> },
    { key: "contact", label: isFrench ? "Contact" : "اتصل بنا", view: "contact", icon: <MessageIcon /> },
    { key: "download", label: isFrench ? "Application" : "التطبيق", href: "/Apk/", icon: <DownloadIcon /> },
  ];

  useEffect(() => {
    document.body.classList.add("has-expanded-bottom-nav");
    return () => document.body.classList.remove("has-expanded-bottom-nav");
  }, []);

  function activate(item) {
    if (item.href) {
      window.location.href = item.href;
      return;
    }
    onNavigate(item.view);
  }

  function isActive(item) {
    if (item.view === "search") return activeView === "exam" || activeView === "year";
    return item.view === activeView;
  }

  function NavButton({ item, compact = false }) {
    const active = isActive(item);
    return (
      <button
        className={`relative grid justify-items-center content-center rounded-[16px] px-1 font-black leading-tight transition duration-200 active:scale-[.94] ${compact ? "min-h-10 gap-0 text-[8px]" : "min-h-12 gap-0.5 text-[9px]"} ${active ? "bg-mauri-green text-white shadow-[0_8px_20px_rgba(21,128,61,.25)]" : "text-slate-500 hover:bg-mauri-green/10 hover:text-mauri-green dark:text-slate-300"}`}
        onClick={() => activate(item)}
        type="button"
        aria-current={active ? "page" : undefined}
        data-control-key={item.key}
        data-haptic
      >
        <span className={`grid place-items-center ${compact ? "h-4 w-4 [&>svg]:h-4 [&>svg]:w-4" : "h-5 w-5 [&>svg]:h-5 [&>svg]:w-5"}`}>{item.icon}</span>
        <span className="max-w-full truncate" data-control-label>{item.label}</span>
        {active && <span className="absolute -bottom-0.5 h-1 w-5 rounded-full bg-white/85" aria-hidden="true" />}
      </button>
    );
  }

  return (
    <nav className="mobile-bottom-nav fixed inset-x-0 bottom-0 z-50 px-2 pb-[max(.5rem,env(safe-area-inset-bottom))] pt-2 md:hidden" aria-label={isFrench ? "Navigation principale" : "التنقل الرئيسي"}>
      <div className="mx-auto max-w-md rounded-[26px] border border-white/75 bg-white/[.94] p-1.5 shadow-[0_-16px_46px_rgba(15,23,42,.13)] backdrop-blur-2xl dark:border-white/10 dark:bg-[#07130d]/[.96]">
        <div className="grid grid-cols-4 gap-1 border-b border-slate-200/80 pb-1 dark:border-white/10">
          {serviceItems.map((item) => <NavButton item={item} compact key={item.key} />)}
        </div>
        <div className="grid grid-cols-4 gap-1 pt-1">
          {primaryItems.map((item) => <NavButton item={item} key={item.key} />)}
        </div>
      </div>
    </nav>
  );
}
