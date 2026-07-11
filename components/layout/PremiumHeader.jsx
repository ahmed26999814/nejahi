"use client";

import LogoMark from "../common/LogoMark";
import { contentValue } from "../common/content";
import { MoonIcon, SunIcon } from "../common/icons";

export default function PremiumHeader({ activeView, content, lang, onNavigate, onToggleLang, text, theme, setTheme }) {
  const navItems = [
    { label: text.home, view: "home" },
    { label: text.toppers, view: "toppers" },
    { label: text.analytics, view: "analytics" },
    { label: lang === "ar" ? "حاسبة المعدل" : "Calculateur", href: "/calculator" },
  ];

  function go(item) {
    if (item.href) {
      window.location.href = item.href;
      return;
    }
    onNavigate(item.view);
  }

  return (
    <header className="sticky top-0 z-40 border-b border-mauri-border/80 bg-white/95 backdrop-blur-xl dark:border-white/10 dark:bg-[#07130d]/95">
      <nav className="app-shell relative flex h-14 items-center justify-between gap-3">
        <button className="flex min-w-0 items-center gap-2.5 text-start" onClick={() => go({ view: "home" })} type="button">
          <LogoMark className="h-9 w-9 rounded-[14px]" src={contentValue(content, "logo", "/logo.png")} />
          <span className="min-w-0">
            <strong className="block truncate text-sm font-black tracking-tight">MauriResults</strong>
            <small className="block truncate text-[11px] font-bold text-slate-500 dark:text-slate-400">{text.platformSubtitle}</small>
          </span>
        </button>

        <div className="hidden items-center gap-2 md:flex">
          {navItems.map((item) => (
            <button className={`nav-link ${!item.href && activeView === item.view ? "bg-mauri-green/10 text-mauri-green" : ""}`} onClick={() => go(item)} type="button" key={item.href || item.view}>{item.label}</button>
          ))}
        </div>

        <div className="flex items-center gap-2">
          <button className="icon-button h-9 w-9" onClick={() => setTheme(theme === "dark" ? "light" : "dark")} type="button" aria-label="تبديل الوضع الليلي">{theme === "dark" ? <MoonIcon /> : <SunIcon />}</button>
          <button className="lang-button" onClick={onToggleLang} type="button" aria-label="Changer la langue">{lang === "ar" ? "FR" : "AR"}</button>
        </div>
      </nav>
    </header>
  );
}
