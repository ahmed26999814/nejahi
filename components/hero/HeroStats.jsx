import AnimatedCounter from "../ui/AnimatedCounter";

const DEFAULT_STATS = [
  { label: "نتيجة", value: 182000 },
  { label: "ولاية", value: 15 },
  { label: "مسابقة", value: 5 },
];

export default function HeroStats({ stats = DEFAULT_STATS }) {
  return (
    <div className="premium-hero-stats">
      {stats.map((item) => (
        <div className="premium-hero-stat" key={item.label}>
          <strong><AnimatedCounter value={item.value} /></strong>
          <span>{item.label}</span>
        </div>
      ))}
    </div>
  );
}
