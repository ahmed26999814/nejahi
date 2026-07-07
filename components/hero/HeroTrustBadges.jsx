const DEFAULT_BADGES = [
  "نتائج رسمية ومنظمة",
  "بحث سريع وآمن",
  "متوافق مع الهاتف",
];

export default function HeroTrustBadges({ badges = DEFAULT_BADGES }) {
  return (
    <div className="premium-trust-badges">
      {badges.map((badge) => (
        <span key={badge} className="premium-trust-badge">
          <span aria-hidden="true">✓</span>
          {badge}
        </span>
      ))}
    </div>
  );
}
