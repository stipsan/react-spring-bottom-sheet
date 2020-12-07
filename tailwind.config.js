const colors = require('tailwindcss/colors')

module.exports = {
  purge: ['./docs/**/*.{js,ts,jsx,tsx}', './pages/**/*.{js,ts,jsx,tsx}'],
  darkMode: 'media', // 'media' or 'class'
  theme: {
    // https://fonts.google.com/specimen/Source+Sans+Pro?query=Source&sidebar.open=true&selection.family=Montserrat:wght@700;900|Source+Sans+Pro
    fontFamily: {
      display: ['Montserrat', 'sans-serif'],
      body: ['Source Sans Pro', 'sans-serif'],
    },
    extend: {
      colors: {
        gray: colors.blueGray,
        hero: {
          DEFAULT: '#592340',
          lighter: '#FC9CC3',
        },
      },
      ringOffsetColor: {
        'rsbs-bg': 'var(--rsbs-bg)',
      },
      transitionDuration: {
        0: '0ms',
      },
    },
  },
  variants: {
    extend: {
      backgroundColor: ['active', 'focus-visible'],
      textColor: ['active', 'focus-visible'],
      transitionDuration: ['focus', 'focus-visible'],
      ringColor: ['group-focus', 'focus-visible'],
      ringOffsetColor: ['group-focus', 'focus-visible'],
      ringOffsetWidth: ['group-focus', 'focus-visible'],
      ringOpacity: ['group-focus', 'focus-visible'],
      ringWidth: ['group-focus', 'focus-visible'],
    },
  },
  plugins: [require('@tailwindcss/forms')],
}
