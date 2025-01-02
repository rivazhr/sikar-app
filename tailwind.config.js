/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{vue,js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Nunito Sans', 'sans-serif'], 
      },
      colors: {
        primary: '#25559B',  
        secondary: '#EFAE00',
        grey: '#F5F6FA',
        error: '#D00416',
        error100: '#FBD1D1',
      }
    },
  },
  variants: {
    fill: ['hover', 'focus'], 
  },
  plugins: [],
}