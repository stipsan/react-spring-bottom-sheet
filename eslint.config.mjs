import js from '@eslint/js'
import tseslint from 'typescript-eslint'
import reactHooks from 'eslint-plugin-react-hooks'
import jsxA11y from 'eslint-plugin-jsx-a11y'
import nextPlugin from '@next/eslint-plugin-next'
import globals from 'globals'

export default tseslint.config(
  {
    ignores: ['dist/**', '.next/**', 'node_modules/**', 'public/**'],
  },
  js.configs.recommended,
  ...tseslint.configs.recommended,
  reactHooks.configs.flat.recommended,
  {
    files: ['**/*.{ts,tsx,js,jsx,mjs}'],
    languageOptions: {
      globals: { ...globals.browser, ...globals.node },
    },
    plugins: { 'jsx-a11y': jsxA11y, '@next/next': nextPlugin },
    rules: {
      ...jsxA11y.configs.recommended.rules,
      ...nextPlugin.configs.recommended.rules,
      'jsx-a11y/anchor-is-valid': 'off',
      '@typescript-eslint/no-explicit-any': 'off',
      '@typescript-eslint/no-unused-vars': [
        'error',
        { argsIgnorePattern: '^_', varsIgnorePattern: '^_' },
      ],
      // The sheet deliberately reads refs during render and flips state from effects so that
      // gestures and springs can drive the animation without re-rendering. These stay visible
      // as warnings; removing them means reworking useReady and the snap point measurement.
      'react-hooks/refs': 'warn',
      'react-hooks/set-state-in-effect': 'warn',
    },
  },
  {
    // Build tooling is CommonJS by design
    files: ['*.config.js', '*.config.mjs'],
    rules: { '@typescript-eslint/no-require-imports': 'off' },
  },
  {
    // The docs site is demo code, held to a lighter standard than the library
    files: ['docs/**', 'pages/**'],
    rules: {
      '@typescript-eslint/no-unused-vars': 'off',
      'jsx-a11y/no-autofocus': 'off',
      'jsx-a11y/click-events-have-key-events': 'off',
      'jsx-a11y/no-static-element-interactions': 'off',
      '@next/next/no-img-element': 'off',
    },
  }
)
