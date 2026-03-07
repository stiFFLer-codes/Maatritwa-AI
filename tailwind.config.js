/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,jsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#6C5CE7', // maternal-purple
          light: '#A29BFE',
          dark: '#5F3DC4',
        },
        secondary: {
          DEFAULT: '#FF6B6B', // maternal-coral
          light: '#FFB4A2',
          dark: '#E63946',
        },
        accent: {
          DEFAULT: '#51CF66', // maternal-mint
          light: '#96F2B4',
          dark: '#37B24D',
        },
        background: '#F8F0E3', // sand
        surface: '#FFF8F0', // cream
        'on-surface': '#2D3748', // charcoal
        'on-surface-variant': '#5A677D',
      },
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
        serif: ['Lora', 'serif'],
      },
      boxShadow: {
        'soft': '0 4px 12px rgba(0, 0, 0, 0.05)',
        'soft-lg': '0 10px 25px rgba(0, 0, 0, 0.05)',
      },
      borderRadius: {
        'xl': '1rem',
        '2xl': '1.5rem',
      },
    },
  },
  plugins: [],
}