/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        cream: "#f4ede0",
        paper: "#ebe1cf",
        ink: "#1a1410",
        wine: "#5c1a1b",
        wineDark: "#3d0f10",
        ember: "#a64228",
        gold: "#a88147",
        moss: "#4a5536",
      },
      fontFamily: {
        display: ['"Cormorant Garamond"', "serif"],
        body: ['"Newsreader"', "serif"],
        mono: ["ui-monospace", "monospace"],
      },
    },
  },
  plugins: [],
};
