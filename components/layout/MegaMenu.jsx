"use client";

import { AwardIcon, ChartIcon, HomeIcon, SearchIcon } from "../common/icons";

export default function MegaMenu({ lang = "ar", onNavigate }) {
  const items = [
    { title: lang === "ar" ? "الرئيسية" : "Accueil", description: lang === "ar" ? "واجهة النتائج والاختيار" : "Page principale", view: "home", icon: <HomeIcon /> },
    { title: lang === "ar" ? "البحث" : "Recherche", description: lang === "ar" ? "بحث سريع بالرقم أو الاسم" : "Recherche rapide", view: "exam", icon: <SearchIcon /> },
    { title: lang === "ar" ? "الأوائل" : "Meilleurs", description: lang === "ar" ? "ترتيب وأفضل النتائج" : "Classements", view: "toppers", icon: <AwardIcon /> },
    { title: lang === "ar" ? "الإحصائيات" : "Stats", description: lang === "ar" ? "لوحات ومؤشرات" : "Tableaux et indicateurs", view: "analytics", icon: <ChartIcon /> },
  ];

  return (
    <div className="grid gap-2 rounded-[28px] border border-white/70 bg-white/[.86] p-3 shadow-premium backdrop-blur-2xl dark:border-white/10 dark:bg-[#10231a]/90 md:grid-cols-2">
      {items.map((item) => (
        <button className="group flex items-start gap-3 rounded-[22px] p-3 text-start transition hover:-translate-y-0.5 hover:bg-mauri-green/10 active:scale-[.99]" onClick={() => onNavigate?.(item.view)} type="button" key={item.view}>
          <span className="grid h-10 w-10 shrink-0 place-items-center rounded-[16px] bg-mauri-green/10 text-mauri-green transition group-hover:bg-mauri-green group-hover:text-white dark:bg-emerald-300/10 dark:text-emerald-300">{item.icon}</span>
          <span className="min-w-0">
            <strong className="block text-sm font-black text-slate-950 dark:text-white">{item.title}</strong>
            <small className="mt-1 block text-xs font-bold text-slate-500 dark:text-slate-300">{item.description}</small>
          </span>
        </button>
      ))}
    </div>
  );
}
