import js from '@eslint/js';
import tseslint from 'typescript-eslint';
import reactHooks from 'eslint-plugin-react-hooks';
import globals from 'globals';

export default tseslint.config(
  {
    ignores: [
      'node_modules/**',
      'dist/**',
      'dev.log',
      'bun.lock',
      'examples/**',
      'mini-services/**',
      'skills/**',
      'scripts/**',
      'tests/**',
      'upload/**',
      'tool-results/**',
      '.zscripts/**',
      'download/**',
      'public/**',
    ],
  },
  {
    files: ['**/*.{ts,tsx}'],
    extends: [js.configs.recommended, ...tseslint.configs.recommended],
    languageOptions: {
      ecmaVersion: 2022,
      globals: { ...globals.browser },
    },
    plugins: {
      'react-hooks': reactHooks,
    },
    rules: {
      'react-hooks/rules-of-hooks': 'error',
      'react-hooks/exhaustive-deps': 'off',
      '@typescript-eslint/no-explicit-any': 'off',
      '@typescript-eslint/no-unused-vars': ['warn', { argsIgnorePattern: '^_', varsIgnorePattern: '^_' }],
      '@typescript-eslint/no-empty-object-type': 'off',
      '@typescript-eslint/no-unsafe-function-type': 'off',
      'no-empty': 'off',
      'no-case-declarations': 'off',
      'no-cond-assign': 'off',
      'no-useless-escape': 'off',
      'no-irregular-whitespace': 'off',
    },
  },
  {
    files: ['*.mjs', 'eslint.config.mjs', 'vite.config.ts'],
    languageOptions: {
      globals: { ...globals.node },
    },
  }
);
