"use client";

import { AwardIcon, HomeIcon } from "../common/icons";

export default function BottomNav({ activeView, onNavigate, text }) {
  const items = [
    { label: text.home, view: "home", icon: <HomeIcon /> },
    { label: text.toppers, view: "toppers", icon: <AwardIcon /> },
  ];

  return (
    <nav className="fixed inset-x-0 bottom-0 z-50 px-3 pb-[max(.55rem,env(safe-area-inset-bottom))] pt-2 md:hidden">
      <div className="mx-auto grid max-w-xs grid-cols-2 gap-1 rounded-[24px] border border-white/70 bg-white/[.92] p-1.5 shadow-[0_-14px_40px_rgba(15,23,42,.10)] backdrop-blur-2xl dark:border-white/10 dark:bg-[#07130d]/[.92]">
        {items.map((item) => (
          <button
            className={`grid justify-items-center gap-1 rounded-[18px] px-2 py-1.5 text-[11px] font-black transition hover:-translate-y-0.5 active:scale-95 ${activeView === item.view ? "bg-mauri-green text-white shadow-soft" : "text-slate-500 hover:bg-mauri-green/10 hover:text-mauri-green dark:text-slate-300"}`}
            onClick={() => onNavigate(item.view)}
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
