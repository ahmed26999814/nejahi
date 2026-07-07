import { ResultActionRail } from "./ResultDesignKit";

export default function ResultShareActions({ actions = [] }) {
  if (!actions.length) return null;

  return (
    <ResultActionRail>
      {actions.map((action) => (
        <button
          className={`tap-button min-h-12 rounded-[18px] px-3 text-xs font-black transition hover:-translate-y-0.5 active:scale-[.98] ${action.variant === "solid" ? "bg-mauri-green text-white shadow-soft" : "border border-white/70 bg-white/[.78] text-slate-600 shadow-soft backdrop-blur-xl hover:text-mauri-green dark:border-white/10 dark:bg-white/[.08] dark:text-slate-300"}`}
          onClick={action.onClick}
          type="button"
          key={action.label}
        >
          <span className="inline-flex items-center justify-center gap-2">
            {action.icon}
            {action.label}
          </span>
        </button>
      ))}
    </ResultActionRail>
  );
}
