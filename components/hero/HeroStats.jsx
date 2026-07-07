import AnimatedCounter from "../ui/AnimatedCounter";

const DEFAULT_STATS = [
  { label: "نتيجة", value: 182000 },
  { label: "ولاية", value: 15 },
  { label: "مسابقة", value: 5 },
];

export default function HeroStats({ stats = DEFAULT_STATS }) {
  return (
    <div className="mt-5 grid grid-cols-3 gap-2">
      {stats.map((item) => (
        <div className="rounded-[20px] border border-white/70 bg-white/[.72] p-3 text-center shadow-soft backdrop-blur-xl dark:border-white/10 dark:bg-white/[.08]" key={item.label}>
          <strong className="block text-lg font-black text-mauri-green dark:text-mauri-gold">
            <AnimatedCounter value={item.value} />
          </strong>
          <span className="mt-1 block text-[11px] font-black text-slate-500 dark:text-slate-300">{item.label}</span>
        </div>
      ))}
    </div>
  );
}
