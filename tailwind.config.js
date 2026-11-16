/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./lib/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      spacing: {
        '18': '4.5rem',
        '22': '5.5rem',
      },
      fontFamily: {
        sans: ["'Plus Jakarta Sans'", "sans-serif"],
        handwriting: ["'Caveat'", "cursive"],
        serif: ["'Playfair Display'", "serif"],
      },
      colors: {
        primary: {
          DEFAULT: "#e8192c",
          hover: "#c81424",
          light: "#fee2e2",
          50: "#fff1f2",
          100: "#ffe4e6",
          500: "#e8192c",
          600: "#c81424",
          700: "#9f121d",
        },
        brand: {
          dark: "#14110f",
          darker: "#0d0b0a",
          card: "#ffffff",
          amber: "#f59e0b",
          amberDark: "#d97706",
          cream: "#faf7f2",
        },
      },
    },
  },
  plugins: [],
};
