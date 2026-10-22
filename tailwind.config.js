/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
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
      },
    },
  },
  plugins: [],
};
