// @ts-check

/** @type import('eslint').Linter.BaseConfig */
module.exports = {
  root: true,
  extends: ['@mizdra/mizdra'],
  env: {
    node: true,
  },
  parserOptions: {
    ecmaFeatures: {
      jsx: true,
    },
  },
  rules: {
    'ban-exponentiation-operator': 2,
    'no-nonoctal-decimal-escape': 2,
    'no-unsafe-negation': 2,
  },
};
