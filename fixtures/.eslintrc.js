// @ts-check

/** @type import('eslint').Linter.BaseConfig */
module.exports = {
  root: true,
  plugins: ['import'],
  env: {
    node: true,
    es2020: true,
  },
  parserOptions: {
    sourceType: 'module',
    ecmaVersion: 2020,
    ecmaFeatures: {
      jsx: true,
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
    'ban-exponentiation-operator': 2,
    'no-useless-escape': 2,
    'no-unsafe-negation': 2,
    'arrow-body-style': [2, 'always'],
  },
};
