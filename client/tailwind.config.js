/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          DEFAULT: '#F29F67',
          dark: '#D8824C',
          light: '#FEF0E6',
        },
        navy: {
          900: '#1E1E2C',
          800: '#0A2C3E',
        },
        aqua: {
          DEFAULT: '#34B1AA',
        }
      }
    },
  },
  plugins: [],
}
