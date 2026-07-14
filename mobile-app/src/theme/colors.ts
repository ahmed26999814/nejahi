export const lightColors = {
  background: "#F4F7F5",
  surface: "#FFFFFF",
  surfaceAlt: "#EAF2ED",
  text: "#12251A",
  muted: "#66736B",
  border: "#DCE7DF",
  primary: "#106B41",
  primarySoft: "#DDF1E6",
  gold: "#C89327",
  danger: "#B63A3A",
  success: "#16834F",
  shadow: "#0A2E1B"
} as const;

export const darkColors = {
  background: "#07130D",
  surface: "#10231A",
  surfaceAlt: "#173426",
  text: "#F5FAF6",
  muted: "#B2C0B7",
  border: "#274334",
  primary: "#5BD194",
  primarySoft: "#163B29",
  gold: "#E3BA5B",
  danger: "#FF8A8A",
  success: "#78D7A5",
  shadow: "#000000"
} as const;

export type AppColors = typeof lightColors;
