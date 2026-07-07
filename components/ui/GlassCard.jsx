export default function GlassCard({ as: Component = "div", className = "", children, ...props }) {
  return (
    <Component
      className={`relative overflow-hidden rounded-[30px] border border-white/70 bg-white/[.78] p-5 shadow-premium backdrop-blur-2xl dark:border-white/10 dark:bg-[#10231a]/75 md:p-6 ${className}`.trim()}
      {...props}
    >
      {children}
    </Component>
  );
}
