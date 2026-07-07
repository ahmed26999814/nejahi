import PremiumButton from "../ui/PremiumButton";

export default function HeroButtons({ onSearchClick, onExploreClick, searchLabel = "ابحث عن نتيجتك", exploreLabel = "استعراض المسابقات" }) {
  return (
    <div className="premium-hero-buttons">
      <PremiumButton type="button" onClick={onSearchClick}>
        {searchLabel}
      </PremiumButton>
      <PremiumButton type="button" variant="light" onClick={onExploreClick}>
        {exploreLabel}
      </PremiumButton>
    </div>
  );
}
