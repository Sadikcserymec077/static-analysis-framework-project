/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        primary: '#0ea5e9', // Sky blue
        secondary: '#0f172a', // Dark slate
        accent: '#14b8a6', // Teal
        background: '#f8fafc', // Off-white
        surface: '#ffffff',
        danger: '#ef4444',
        warning: '#f59e0b',
        success: '#22c55e',
        info: '#3b82f6',
      },
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
