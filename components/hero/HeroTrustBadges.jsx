const DEFAULT_BADGES = [
  "نتائج رسمية ومنظمة",
  "بحث سريع وآمن",
  "متوافق مع الهاتف",
];

export default function HeroTrustBadges({ badges = DEFAULT_BADGES }) {
  return (
    <div className="flex flex-wrap gap-2">
      {badges.map((badge) => (
        <span key={badge} className="inline-flex items-center gap-1 rounded-full border border-mauri-green/15 bg-mauri-green/10 px-3 py-1.5 text-[11px] font-black text-mauri-green dark:border-emerald-300/20 dark:bg-emerald-300/10 dark:text-emerald-300">
          <span aria-hidden="true">✓</span>
          {badge}
        </span>
      ))}
    </div>
  );
}
