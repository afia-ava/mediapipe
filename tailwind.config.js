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
      keyframes: {
        'pose-pulse': {
          '0%, 100%' : { transform: 'scale(1)' },
          '50%' : { transform: 'scale(1.05)' },
        }
      },
      animation: {
        'pose-pulse' : 'pose-pulse 0.6s ease-out',
      },
      fontSize: {
        '1': '34px',
        '2': '18px',
        '3': '14px',
        '4': '12px',
        '5': '20px',
        '6': '16px',
        '7': '28px',
        '8': '32px',
      }
    },
  },
  plugins: [],
}


