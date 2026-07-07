import FloatingOrb from "../ui/FloatingOrb";

export default function HeroBackground() {
  return (
    <div className="pointer-events-none absolute inset-0 -z-10 overflow-hidden" aria-hidden="true">
      <span className="absolute inset-0 opacity-[.35] [background-image:linear-gradient(rgba(21,128,61,.08)_1px,transparent_1px),linear-gradient(90deg,rgba(21,128,61,.08)_1px,transparent_1px)] [background-size:38px_38px] [mask-image:radial-gradient(circle_at_center,black,transparent_72%)]" />
      <FloatingOrb tone="green" className="right-[-5rem] top-[-4rem] h-56 w-56" />
      <FloatingOrb tone="gold" className="bottom-[-5rem] left-[-3rem] h-60 w-60" />
      <FloatingOrb tone="blue" className="left-1/3 top-1/2 h-44 w-44" />
    </div>
  );
}
