export default function PremiumButton({ as: Component = "button", variant = "solid", className = "", children, ...props }) {
  const variantClass = variant === "light"
    ? "border border-white/70 bg-white/[.82] text-slate-700 hover:border-mauri-green/35 hover:bg-white hover:text-mauri-green dark:border-white/10 dark:bg-white/[.10] dark:text-slate-100 dark:hover:bg-white/[.14]"
    : "bg-gradient-to-l from-mauri-green via-emerald-600 to-emerald-500 text-white shadow-[0_18px_42px_rgba(21,128,61,.24)] hover:shadow-[0_22px_52px_rgba(21,128,61,.32)]";

  return (
    <Component
      className={`inline-flex min-h-12 items-center justify-center rounded-[18px] px-5 text-sm font-black transition duration-300 hover:-translate-y-0.5 active:scale-[.98] ${variantClass} ${className}`.trim()}
      {...props}
    >
      {children}
    </Component>
  );
}
