"use client";

import LogoMark from "../common/LogoMark";
import { contentValue } from "../common/content";
import { MoonIcon, SunIcon } from "../common/icons";

export default function PremiumHeader({ activeView, content, lang, onNavigate, onToggleLang, text, theme, setTheme }) {
  const navItems = [
    { key: "home", label: text.home, view: "home" },
    { key: "toppers", label: text.toppers, view: "toppers" },
    { key: "analytics", label: text.analytics, view: "analytics" },
    { key: "average-frequency", label: lang === "ar" ? "تكرار المعدلات" : "Fréquence", href: "/average-frequency" },
    { key: "orientation", label: lang === "ar" ? "التوجيه الجامعي" : "Orientation", href: "/orientation" },
    { key: "lessons", label: lang === "ar" ? "الدروس" : "Cours", href: "/lessons" },
    { key: "calculator", label: lang === "ar" ? "حاسبة المعدل" : "Calculateur", href: "/calculator" },
  ];

  function go(item) {
    if (item.href) {
      window.location.href = item.href;
      return;
    }
    onNavigate(item.view);
  }

  return (
    <header className="sticky top-0 z-40 border-b border-mauri-border/75 bg-white/[.92] shadow-[0_8px_28px_rgba(15,23,42,.04)] backdrop-blur-2xl dark:border-white/10 dark:bg-[#07130d]/[.92]">
      <nav className="app-shell relative flex h-14 items-center justify-between gap-3" aria-label={lang === "ar" ? "التنقل الرئيسي" : "Navigation principale"}>
        <button className="flex min-w-0 items-center gap-2.5 rounded-2xl text-start active:scale-[.98]" onClick={() => go({ view: "home" })} type="button" data-control-key="home" data-haptic>
          <LogoMark className="h-9 w-9 rounded-[14px]" src={contentValue(content, "logo", "/logo.png")} />
          <span className="min-w-0">
            <strong className="block truncate text-sm font-black tracking-tight">MauriResults</strong>
            <small className="app-header-subtitle block truncate text-[11px] font-bold text-slate-500 dark:text-slate-400">{text.platformSubtitle}</small>
          </span>
        </button>

        <div className="hidden items-center gap-1.5 md:flex">
          {navItems.map((item) => {
            const active = !item.href && activeView === item.view;
            return (
              <button
                className={`nav-link min-h-10 rounded-xl px-3 transition ${active ? "bg-mauri-green text-white shadow-[0_8px_18px_rgba(21,128,61,.18)]" : "hover:bg-mauri-green/10 hover:text-mauri-green"}`}
                onClick={() => go(item)}
                type="button"
                key={item.key}
                aria-current={active ? "page" : undefined}
                data-control-key={item.key}
                data-haptic
              >
                <span data-control-label>{item.label}</span>
              </button>
            );
          })}
        </div>

        <div className="flex items-center gap-1.5">
          <button className="icon-button h-9 w-9 rounded-xl" onClick={() => setTheme(theme === "dark" ? "light" : "dark")} type="button" aria-label={lang === "ar" ? "تبديل الوضع الليلي" : "Changer le thème"} data-haptic>{theme === "dark" ? <MoonIcon /> : <SunIcon />}</button>
          <button className="lang-button min-h-9 rounded-xl" onClick={onToggleLang} type="button" aria-label="Changer la langue" data-haptic>{lang === "ar" ? "FR" : "AR"}</button>
        </div>
      </nav>
    </header>
  );
}
