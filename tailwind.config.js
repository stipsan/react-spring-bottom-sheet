module.exports = {
  purge: ['./docs/**/*.{js,ts,jsx,tsx}', './pages/**/*.{js,ts,jsx,tsx}'],
  darkMode: 'media', // 'media' or 'class'
  theme: {
    // https://fonts.google.com/specimen/Source+Sans+Pro?query=Source&sidebar.open=true&selection.family=Montserrat:wght@700;900|Source+Sans+Pro
    fontFamily: {
      display: ['Montserrat', 'sans-serif'],
      body: ['Source Sans Pro', 'sans-serif'],
    },

    extend: {},
  },
  variants: {
    extend: {},
  },
  plugins: [],
}
