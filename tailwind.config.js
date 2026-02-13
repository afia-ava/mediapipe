export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'papyrus-light': '#f5e6d3',
        'papyrus-medium': '#e8d4b8',
        'papyrus-dark': '#d4b896',
        'papyrus-darker': '#c49876',
        'bronze-light': '#c9a961',
        'bronze-medium': '#a0826d',
        'bronze-dark': '#6b5d52',
        'stone-light': '#8b8680',
        'stone-medium': '#5c5955',
        'stone-dark': '#3a3835',
        'gold': '#d4af37',
        'gold-dark': '#9a7f2a',
        'red-ochre': '#a0522d',
        'text-dark': '#2c2416',
      },
      fontFamily: {
        serif: ['EB Garamond', 'serif'],
        sans: ['Lexend', 'sans-serif'],
      },
    },
  },
  plugins: [],
}