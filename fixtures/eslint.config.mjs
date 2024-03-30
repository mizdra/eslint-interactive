// @ts-check

import { FlatCompat } from '@eslint/eslintrc';

const compat = new FlatCompat();

export default [
  ...compat.plugins('import'),
  ...compat.env({ node: true, es2020: true }),
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
      'import/order': [2, { alphabetize: { order: 'asc' } }],
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
]
