/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: "class",
  content: ["./app/**/*.{js,jsx}", "./components/**/*.{js,jsx}"],
  theme: {
    extend: {
      fontFamily: {
        arabic: ["Tajawal", "IBM Plex Sans Arabic", "Cairo", "Tahoma", "sans-serif"],
      },
      colors: {
        mauri: {
          green: "#007A3D",
          gold: "#F4B400",
          coral: "#DF3F2D",
          blue: "#1769E0",
          teal: "#008C87",
          ink: "#101828",
          bg: "#F3F6FA",
          card: "#FFFFFF",
          border: "#D8E0EA",
        },
      },
      boxShadow: {
        soft: "0 8px 22px rgba(8, 31, 61, .08)",
        premium: "0 14px 34px rgba(8, 31, 61, .11)",
        glow: "0 14px 34px rgba(0, 122, 61, .20)",
        gold: "0 12px 30px rgba(244, 180, 0, .22)",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
};
