const { dirname } = require('node:path');
const globals = require('globals');
const js = require('@eslint/js');
const tseslint = require('typescript-eslint');
const prettierPlugin = require('eslint-plugin-prettier');

/** @type {import('eslint').Linter.FlatConfig[]} */
module.exports = [
  js.configs.recommended,
  ...tseslint.configs.recommended,
  {
    files: ['eslint.config.js'],
    rules: {
      '@typescript-eslint/no-require-imports': 'off',
    },
  },
  {
    languageOptions: {
      globals: {
        ...globals.node,
        ...globals.jest,
      },
      parser: tseslint.parser,
      parserOptions: {
        project: './tsconfig.json',
        tsconfigRootDir: dirname(__filename),
        sourceType: 'module',
      },
    },
    rules: {
      '@typescript-eslint/interface-name-prefix': 'off',
      '@typescript-eslint/explicit-function-return-type': 'off',
      '@typescript-eslint/explicit-module-boundary-types': 'off',
      '@typescript-eslint/no-explicit-any': 'off',
      'no-return-await': 'error',
    },
  },
  {
    files: ['**/*.spec.ts'],
    rules: {
      '@typescript-eslint/ban-ts-comment': 'off',
    },
  },
  {
    plugins: {
      prettier: prettierPlugin,
    },
    rules: {
      'prettier/prettier': 'error',
    },
  },
];
