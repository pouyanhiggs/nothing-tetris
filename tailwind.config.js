/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'nothing-black': '#000000',
        'nothing-dark': '#121212',
        'nothing-border': '#272727',
        'nothing-red': '#D71921',
      },
    },
  },
  plugins: [],
}