const { version: reactVersion } = require('react/package.json')

module.exports = {
  extends: ['react-app'],
  settings: { react: { version: reactVersion } },
  plugins: ['simple-import-sort'],
  rules: {
    'simple-import-sort/imports': 'error',
    'simple-import-sort/exports': 'error',
    'jsx-a11y/anchor-is-valid': ['off'],
  },
}
