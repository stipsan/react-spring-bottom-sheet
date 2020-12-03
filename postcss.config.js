const path = require('path')

module.exports = {
  plugins: {
    tailwindcss: {},
    'postcss-custom-properties-fallback': {
      importFrom: path.resolve(__dirname, './defaults.json'),
    },
    // @TODO add importFrom to preset-env when CSS snapshot testing is in place
    'postcss-preset-env': { stage: 0 },
    'postcss-import-svg': {
      paths: [path.resolve(__dirname, 'docs')],
      svgo: {
        plugins: [
          {
            removeUnknownsAndDefaults: {
              // On by default, disabled as it breaks the frame.svg
              unknownAttrs: false,
            },
          },
        ],
      },
    },
    autoprefixer: {},
  },
}
