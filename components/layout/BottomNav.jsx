"use client";

import { AwardIcon, ChartIcon, HomeIcon, SearchIcon } from "../common/icons";

function BookIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M4 5.5A2.5 2.5 0 0 1 6.5 3H11a3 3 0 0 1 3 3v14a3 3 0 0 0-3-3H6.5A2.5 2.5 0 0 0 4 19.5z" />
      <path d="M20 5.5A2.5 2.5 0 0 0 17.5 3H14v17a3 3 0 0 1 3-3h.5a2.5 2.5 0 0 1 2.5 2.5z" />
    </svg>
  );
}

function CalculatorIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <rect x="4" y="2.5" width="16" height="19" rx="3" />
      <path d="M8 6.5h8M8 11h1M12 11h1M16 11h1M8 15h1M12 15h1M16 15h1M8 18h1M12 18h5" />
    </svg>
  );
}

export default function BottomNav({ activeView, onNavigate, text }) {
  const items = [
    { label: text.home, view: "home", icon: <HomeIcon /> },
    { label: text.search, view: "search", icon: <SearchIcon /> },
    { label: "الدروس", href: "/lessons", icon: <BookIcon /> },
    { label: "حاسبة المعدل", href: "/calculator", icon: <CalculatorIcon /> },
    { label: text.toppers, view: "toppers", icon: <AwardIcon /> },
    { label: text.analytics, view: "analytics", icon: <ChartIcon /> },
  ];

  function activate(item) {
    if (item.href) {
      window.location.href = item.href;
      return;
    }
    onNavigate(item.view);
  }

  return (
    <nav className="fixed inset-x-0 bottom-0 z-50 px-2 pb-[max(.55rem,env(safe-area-inset-bottom))] pt-2 md:hidden">
      <div className="mx-auto grid max-w-lg grid-cols-6 gap-1 rounded-[24px] border border-white/70 bg-white/[.92] p-1.5 shadow-[0_-14px_40px_rgba(15,23,42,.10)] backdrop-blur-2xl dark:border-white/10 dark:bg-[#07130d]/[.92]">
        {items.map((item) => (
          <button
            className={`grid min-h-12 justify-items-center content-center gap-1 rounded-[18px] px-0.5 py-1.5 text-[7px] font-black leading-tight transition hover:-translate-y-0.5 active:scale-95 ${(!item.href && (item.view === "search" ? activeView === "exam" : activeView === item.view)) ? "bg-mauri-green text-white shadow-soft" : "text-slate-500 hover:bg-mauri-green/10 hover:text-mauri-green dark:text-slate-300"}`}
            onClick={() => activate(item)}
            type="button"
            key={item.label}
          >
            {item.icon}
            <span>{item.label}</span>
          </button>
        ))}
      </div>
    </nav>
  );
}
