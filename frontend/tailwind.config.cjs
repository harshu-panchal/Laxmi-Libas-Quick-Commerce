/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: "#14b8a6",
          dark: "#0f766e",
          light: "#5eead4",
        },
      },
    },
  },
  plugins: [],
};
