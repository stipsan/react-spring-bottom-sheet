const path = require('path')
const svgo = require('postcss-svgo')
const importFrom = path.resolve(__dirname, './defaults.json')

module.exports = {
  plugins: {
    tailwindcss: {},
    'postcss-custom-properties-fallback': { importFrom },
    // @TODO add importFrom to preset-env when CSS snapshot testing is in place
    'postcss-preset-env': { importFrom, stage: 0 },
    'postcss-import-svg': {
      paths: [path.resolve(__dirname, 'docs')],
      svgo: svgo({
        plugins: [
          {
            removeUnknownsAndDefaults: {
              // On by default, disabled as it breaks the frame.svg
              unknownAttrs: false,
            },
          },
        ],
      }),
    },
    autoprefixer: {},
  },
}
