const path = require('path')

module.exports = {
  plugins: {
    tailwindcss: {},
    'postcss-custom-properties-fallback': {
      importFrom: {
        customProperties: {
          '--rsbs-backdrop-bg': 'rgba(0, 0, 0, 0.6)',
          '--rsbs-backdrop-opacity': '1',
          '--rsbs-bg': '#fff',
          '--rsbs-content-opacity': '1',
          '--rsbs-handle-bg': 'hsla(0, 0%, 0%, 0.14)',
          '--rsbs-max-w': 'auto',
          '--rsbs-ml': 'env(safe-area-inset-left)',
          '--rsbs-mr': 'env(safe-area-inset-right)',
          '--rsbs-rounded': '16px',
          '--rsbs-y': '0px',
        },
      },
    },
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
