import HeroBackground from "./HeroBackground";
import HeroButtons from "./HeroButtons";
import HeroStats from "./HeroStats";
import HeroTrustBadges from "./HeroTrustBadges";
import GlassCard from "../ui/GlassCard";

export default function Hero({ title, description, eyebrow = "MauriResults", stats, onSearchClick, onExploreClick }) {
  return (
    <section className="premium-hero-section" dir="rtl">
      <HeroBackground />
      <div className="premium-hero-content">
        <div className="premium-hero-copy">
          <span className="premium-hero-eyebrow">{eyebrow}</span>
          <h1>{title}</h1>
          <p>{description}</p>
          <HeroButtons onSearchClick={onSearchClick} onExploreClick={onExploreClick} />
          <HeroTrustBadges />
        </div>
        <GlassCard className="premium-hero-card">
          <span className="premium-hero-card-kicker">لوحة النتائج</span>
          <strong>MauriResults</strong>
          <p>منصة سريعة ومنظمة لعرض نتائج المسابقات الوطنية في موريتانيا.</p>
          <HeroStats stats={stats} />
        </GlassCard>
      </div>
    </section>
  );
}
