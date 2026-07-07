const ORB_TONES = {
  green: "bg-mauri-green/25 dark:bg-emerald-300/20",
  gold: "bg-mauri-gold/25 dark:bg-mauri-gold/20",
  blue: "bg-sky-400/20 dark:bg-sky-300/15",
};

export default function FloatingOrb({ className = "", tone = "green" }) {
  return (
    <span
      aria-hidden="true"
      className={`pointer-events-none absolute rounded-full blur-3xl ${ORB_TONES[tone] || ORB_TONES.green} ${className}`.trim()}
    />
  );
}
