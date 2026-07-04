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
          green: "#15803D",
          gold: "#D4AF37",
          ink: "#0F172A",
          bg: "#F8FAF8",
          card: "#FFFFFF",
          border: "#E5E7EB",
        },
      },
      boxShadow: {
        soft: "0 10px 30px rgba(15, 23, 42, .06)",
        premium: "0 18px 55px rgba(15, 23, 42, .08)",
        glow: "0 20px 60px rgba(21, 128, 61, .12)",
        gold: "0 18px 45px rgba(212, 175, 55, .14)",
      },
    },
  },
  plugins: [],
};
