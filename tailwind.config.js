/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        rodobens: {
          dark: '#00441F',
          vivid: '#00CF7B',
          light: '#E0E5CF',
          orange: '#FF7A40',
          blue: '#00A8E2',
        },
      },
      fontFamily: {
        montserrat: ['Montserrat', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
