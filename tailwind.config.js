/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        fox: {
          50:  '#fff4ef',
          100: '#ffe6d9',
          200: '#ffc9b0',
          300: '#ffa37d',
          400: '#ff7b47',
          500: '#FF6B35',
          600: '#e84e14',
          700: '#c13c0e',
          800: '#9a3212',
          900: '#7c2d12',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
