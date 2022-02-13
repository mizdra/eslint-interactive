// @ts-check

/** @type import('eslint').Linter.BaseConfig */
module.exports = {
  root: true,
  env: {
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
    // fixable
    semi: 'error', // target
    eqeqeq: 'error',
  },
};
