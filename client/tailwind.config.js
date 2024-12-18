/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        navy: {
          dark: '#12132b',
          DEFAULT: '#1a1b3b',
          light: '#2d2f5a',
        },
        rose: {
          dark: '#cc2952',
          DEFAULT: '#ff3366',
          light: '#ff668c',
        },
        text: {
          primary: '#ffffff',
          secondary: '#b4b5c5',
          disabled: '#6e7086',
        },
      },
    },
  },
  plugins: [],
}