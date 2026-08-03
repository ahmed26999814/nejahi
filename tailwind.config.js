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
          green: "#177245",
          gold: "#E3A72F",
          coral: "#E86F51",
          blue: "#397FBA",
          teal: "#268F83",
          ink: "#18332A",
          bg: "#F7F4EC",
          card: "#FFFDF8",
          border: "#E6DED0",
        },
      },
      boxShadow: {
        soft: "0 8px 22px rgba(67, 52, 33, .07)",
        premium: "0 14px 34px rgba(67, 52, 33, .09)",
        glow: "0 14px 34px rgba(23, 114, 69, .14)",
        gold: "0 12px 30px rgba(227, 167, 47, .16)",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
};
