import { AwardIcon, ChartIcon, HomeIcon, SearchIcon } from "../common/icons";

export default function FooterLinks({ onNavigate, text }) {
  const links = [
    { label: text.home || "Home", view: "home", icon: <HomeIcon /> },
    { label: text.search || "Search", view: "exam", icon: <SearchIcon /> },
    { label: text.toppers || "Top", view: "toppers", icon: <AwardIcon /> },
    { label: text.analytics || "Stats", view: "analytics", icon: <ChartIcon /> },
  ];

  return (
    <div className="grid gap-2">
      {links.map((item) => (
        <button className="flex items-center gap-2 rounded-[18px] border border-white/70 bg-white/[.60] px-3 py-2 text-start text-xs font-black text-slate-600 shadow-soft transition hover:-translate-y-0.5 hover:text-mauri-green dark:border-white/10 dark:bg-white/[.06] dark:text-slate-300" onClick={() => onNavigate?.(item.view)} type="button" key={item.view}>
          <span className="text-mauri-green dark:text-mauri-gold">{item.icon}</span>
          {item.label}
        </button>
      ))}
    </div>
  );
}
