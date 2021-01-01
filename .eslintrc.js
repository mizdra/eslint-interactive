// @ts-check

/** @type import('eslint').Linter.BaseConfig */
module.exports = {
  root: true,
  extends: [
    // basic
    '@mizdra/mizdra',
    '@mizdra/mizdra/+typescript',
    '@mizdra/mizdra/+prettier',
  ],
  env: {
    node: true,
  },
  overrides: [
    // for typescript
    {
      files: ['*.ts', '*.tsx'],
      parserOptions: {
        project: ['./tsconfig.src.json', './tsconfig.test.json'],
      },
      rules: {},
    },
    // for test
    {
      files: ['test/**/*.{ts,tsx}'],
      env: {
        jest: true,
      },
    },
  ],
};
