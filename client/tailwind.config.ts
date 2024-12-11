/** @type {import('tailwindcss').Config} */
module.exports = {
    content: ['./src/**/*.{js,jsx,ts,tsx}'],
    theme: {
      extend: {
        colors: {
          'navy': {
            DEFAULT: '#1a1b3b',
            dark: '#12132b',
            light: '#2d2f5a',
          },
          'rose': {
            DEFAULT: '#ff3366',
            light: '#ff668c',
            dark: '#cc2952',
          },
          'gray': {
            light: '#ffffff',
            medium: '#b4b5c5',
            dark: '#6e7086',
          },
        },
      },
    },
    plugins: [],
  };