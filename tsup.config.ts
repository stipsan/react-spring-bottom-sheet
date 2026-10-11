import { defineConfig } from 'tsup'

export default defineConfig({
  entry: ['src/index.tsx'],
  format: ['cjs', 'esm'],
  dts: true,
  tsconfig: 'tsconfig.build.json',
  sourcemap: true,
  clean: true,
  treeshake: true,
  // Matches the browserslist field: optional chaining is Chrome 80+, so it gets downleveled
  target: 'es2019',
  external: ['react', 'react-dom'],
})
