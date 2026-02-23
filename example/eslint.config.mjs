// @ts-check

import { defineConfig } from "eslint/config";

export default defineConfig([
  {
    files: ['**/*.js', '**/*.mjs', '**/*.jsx'],
    languageOptions: {
      sourceType: 'module',
      ecmaVersion: 2020,
      parserOptions: {
        ecmaFeatures: {
          jsx: true,
        },
      },
    },
    rules: {
      'semi': 2,
      'prefer-const': 2,
      'no-unused-vars': [
        2,
        {
          ignoreRestSiblings: true,
          argsIgnorePattern: '^_',
          caughtErrors: 'all',
        },
      ],
      'ban-exponentiation-operator': 'off', // Disable in flat config
      'no-useless-escape': 2,
      'no-unsafe-negation': 2,
      'arrow-body-style': [2, 'always'],

    },
  },
]);
