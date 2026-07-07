import FloatingOrb from "../ui/FloatingOrb";

export default function HeroBackground() {
  return (
    <div className="premium-hero-background" aria-hidden="true">
      <span className="premium-hero-grid" />
      <FloatingOrb tone="green" className="premium-orb-one" />
      <FloatingOrb tone="gold" className="premium-orb-two" />
      <FloatingOrb tone="blue" className="premium-orb-three" />
    </div>
  );
}
