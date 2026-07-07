export const brandIdentity = {
  name: "MauriResults",
  tone: "premium civic glassmorphism",
  colors: {
    emerald: "#15803d",
    emeraldSoft: "rgba(21,128,61,.12)",
    gold: "#d4af37",
    ink: "#0f2418",
    paper: "#fbfdf8",
    night: "#06120c",
  },
  typography: {
    display: "heavy Arabic display, tight tracking, balanced line-height",
    body: "bold readable Arabic/French UI text",
  },
  surfaces: {
    glass: "border-white/70 bg-white/[.78] shadow-premium backdrop-blur-2xl",
    darkGlass: "dark:border-white/10 dark:bg-[#10231a]/75",
  },
  motion: {
    page: "opacity and soft slide-up on load",
    hover: "translate-y micro-lift with soft premium shadow",
    counters: "requestAnimationFrame count-up animation",
  },
  logoGuidelines: [
    "Keep the mark inside a rounded square.",
    "Use emerald and gold as primary accents.",
    "Avoid stretching or placing the logo over low-contrast images.",
  ],
};

export const uxStates = {
  loading: "skeleton shimmer",
  empty: "soft bordered glass card with clear next action",
  error: "red text on light glass card with retry path",
  success: "green/gold badges with celebratory feedback",
};
