export default function FloatingOrb({ className = "", tone = "green" }) {
  return <span aria-hidden="true" className={`floating-orb floating-orb-${tone} ${className}`.trim()} />;
}
