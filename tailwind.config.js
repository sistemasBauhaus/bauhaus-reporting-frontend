// filepath: /Users/sofia/Desktop/bauhaus-reporting/frontend/tailwind.config.js
module.exports = {
  content: [
    "./src/**/*.{js,ts,jsx,tsx}"
  ],
  theme: {
    extend: {
      colors: {
        bauhaus: {
          light: '#e3eafc',
          DEFAULT: '#1746a0', // azul profesional
          dark: '#0c2340',    // azul oscuro elegante
        },
      },
    },
  },
  plugins: [],
}