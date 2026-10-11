const path = require('path')

// The published stylesheet and the docs site have nothing in common, so they get separate
// pipelines: the library never needs Tailwind, and the docs never need the custom property
// fallbacks that defaults.json provides for the sheet's own variables.
const isLibrary = process.env.POSTCSS_TARGET === 'library'
const importFrom = path.resolve(__dirname, './defaults.json')

const library = {
  'postcss-custom-properties-fallback': { importFrom },
  // @TODO add importFrom to preset-env when CSS snapshot testing is in place
  'postcss-preset-env': { importFrom, stage: 0 },
  autoprefixer: {},
}

const docs = {
  // Tailwind 4 handles nesting and vendor prefixes itself through Lightning CSS
  '@tailwindcss/postcss': {},
  'postcss-import-svg': { paths: [path.resolve(__dirname, 'docs')] },
  // The docs import the sheet's source stylesheet, which relies on these defaults
  'postcss-custom-properties-fallback': { importFrom },
}

module.exports = { plugins: isLibrary ? library : docs }
