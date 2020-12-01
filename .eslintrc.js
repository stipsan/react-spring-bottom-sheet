const { version: reactVersion } = require('react/package.json')

module.exports = {
  extends: ['react-app'],
  settings: { react: { version: reactVersion } },
  rules: {
    'jsx-a11y/anchor-is-valid': ['off'],
  },
}
