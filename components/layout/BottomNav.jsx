"use client";

import { useEffect, useState } from "react";
import { GraduationCap, MoreHorizontal, X } from "lucide-react";
import { AwardIcon, ChartIcon, HomeIcon, SearchIcon } from "../common/icons";

function BookIcon() {
  return <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 5.5A2.5 2.5 0 0 1 6.5 3H11a3 3 0 0 1 3 3v14a3 3 0 0 0-3-3H6.5A2.5 2.5 0 0 0 4 19.5z" /><path d="M20 5.5A2.5 2.5 0 0 0 17.5 3H14v17a3 3 0 0 1 3-3h.5a2.5 2.5 0 0 1 2.5 2.5z" /></svg>;
}

function CalculatorIcon() {
  return <svg viewBox="0 0 24 24" aria-hidden="true"><rect x="4" y="2.5" width="16" height="19" rx="3" /><path d="M8 6.5h8M8 11h1M12 11h1M16 11h1M8 15h1M12 15h1M16 15h1M8 18h1M12 18h5" /></svg>;
}

function DownloadIcon() {
  return <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 3v12M7 10l5 5 5-5" /><path d="M5 21h14" /></svg>;
}

export default function BottomNav({ activeView, onNavigate, text }) {
  const isFrench = text?.home === "Accueil";
  const [moreOpen, setMoreOpen] = useState(false);

  const primaryItems = [
    { key: "home", label: text.home, view: "home", icon: <HomeIcon /> },
    { key: "search", label: text.search, view: "search", icon: <SearchIcon /> },
    { key: "toppers", label: text.toppers, view: "toppers", icon: <AwardIcon /> },
    {
      key: "orientation",
      label: isFrench ? "Orientation" : "التوجيه",
      href: "/orientation",
      icon: <GraduationCap strokeWidth={2.2} />,
    },
    { key: "more", label: isFrench ? "Plus" : "المزيد", more: true, icon: <MoreHorizontal /> },
  ];

  const secondaryItems = [
    { key: "analytics", label: text.analytics, view: "analytics", icon: <ChartIcon /> },
    { key: "lessons", label: isFrench ? "Cours" : "الدروس", href: "/lessons", icon: <BookIcon /> },
    { key: "calculator", label: isFrench ? "Calculateur" : "الحاسبة", href: "/calculator", icon: <CalculatorIcon /> },
    { key: "download", label: isFrench ? "Application" : "التطبيق", href: "/Apk/", icon: <DownloadIcon /> },
  ];

  useEffect(() => {
    document.body.classList.add("has-expanded-bottom-nav");
    return () => document.body.classList.remove("has-expanded-bottom-nav");
  }, []);

  function activate(item) {
    if (item.more) {
      setMoreOpen((value) => !value);
      return;
    }
    setMoreOpen(false);
    if (item.href) {
      window.location.href = item.href;
      return;
    }
    onNavigate(item.view);
  }

  function isActive(item) {
    if (item.key === "more") return activeView === "analytics";
    if (item.view === "search") return activeView === "exam" || activeView === "year";
    return item.view === activeView;
  }

  return (
    <>
      {moreOpen && (
        <button
          className="fixed inset-0 z-40 bg-slate-950/30 backdrop-blur-[2px] md:hidden"
          onClick={() => setMoreOpen(false)}
          type="button"
          aria-label={isFrench ? "Fermer le menu" : "إغلاق القائمة"}
        />
      )}

      <nav className="mobile-bottom-nav fixed inset-x-0 bottom-0 z-50 px-2 pb-[max(.5rem,env(safe-area-inset-bottom))] pt-2 md:hidden" aria-label={isFrench ? "Navigation principale" : "التنقل الرئيسي"}>
        {moreOpen && (
          <section className="absolute inset-x-3 bottom-[calc(100%+.45rem)] mx-auto max-w-md rounded-[24px] border border-white/80 bg-white/95 p-3 shadow-[0_-18px_50px_rgba(15,23,42,.18)] backdrop-blur-2xl dark:border-white/10 dark:bg-[#0a1710]/95">
            <div className="mb-2 flex items-center justify-between px-1">
              <strong className="text-sm font-black text-slate-950 dark:text-white">
                {isFrench ? "Plus de services" : "خدمات أخرى"}
              </strong>
              <button className="grid h-8 w-8 place-items-center rounded-xl bg-slate-100 text-slate-600 dark:bg-white/10 dark:text-slate-200" onClick={() => setMoreOpen(false)} type="button" aria-label={isFrench ? "Fermer" : "إغلاق"}>
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="grid grid-cols-2 gap-2">
              {secondaryItems.map((item) => (
                <button
                  className="flex min-h-14 items-center gap-3 rounded-2xl border border-slate-200 bg-slate-50 px-3 text-right text-sm font-black text-slate-700 transition active:scale-[.97] dark:border-white/10 dark:bg-white/5 dark:text-slate-100"
                  onClick={() => activate(item)}
                  type="button"
                  key={item.key}
                >
                  <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-mauri-green/10 text-mauri-green [&>svg]:h-5 [&>svg]:w-5 dark:text-emerald-300">
                    {item.icon}
                  </span>
                  <span>{item.label}</span>
                </button>
              ))}
            </div>
          </section>
        )}

        <div className="mx-auto grid max-w-md grid-cols-5 gap-1 rounded-[24px] border border-white/75 bg-white/[.95] p-1.5 shadow-[0_-16px_46px_rgba(15,23,42,.13)] backdrop-blur-2xl dark:border-white/10 dark:bg-[#07130d]/[.97]">
          {primaryItems.map((item) => {
            const active = isActive(item);
            return (
              <button
                className={`relative grid min-h-12 min-w-0 content-center justify-items-center gap-1 rounded-[15px] px-1 text-[10px] font-black leading-3 transition duration-200 active:scale-[.94] ${active ? "bg-mauri-green text-white shadow-[0_8px_20px_rgba(21,128,61,.25)]" : "text-slate-500 hover:bg-mauri-green/10 hover:text-mauri-green dark:text-slate-300"}`}
                onClick={() => activate(item)}
                type="button"
                key={item.key}
                aria-current={active ? "page" : undefined}
                data-control-key={item.key}
                data-haptic
              >
                <span className="grid h-[21px] w-[21px] place-items-center [&>svg]:h-[21px] [&>svg]:w-[21px]">{item.icon}</span>
                <span className="block w-full truncate text-center" data-control-label>{item.label}</span>
                {active && <span className="absolute -bottom-0.5 h-1 w-4 rounded-full bg-white/85" aria-hidden="true" />}
              </button>
            );
          })}
        </div>
      </nav>
    </>
  );
}
