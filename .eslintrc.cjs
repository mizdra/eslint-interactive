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
  parserOptions: {
    ecmaVersion: 2021,
  },
  env: {
    node: true,
  },
  rules: {
    'import/no-extraneous-dependencies': 'error',
  },
  overrides: [
    // for typescript
    {
      files: ['*.ts', '*.tsx'],
      parserOptions: {
        project: ['./tsconfig.src.json', './tsconfig.test.json'],
      },
      rules: {
        // ts-ignore は覚悟のある時にしか使わないので、いちいち lint error にする必要もない
        '@typescript-eslint/ban-ts-comment': 'off',
        // 煩すぎるので off
        '@typescript-eslint/no-unsafe-return': 'off',
        // 煩すぎるので off
        '@typescript-eslint/no-unsafe-argument': 'off',
        // disable because this rule do not support ESM in TypeScript.
        // ref: https://github.com/import-js/eslint-plugin-import/issues/2170
        'import/no-unresolved': 'off',
      },
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
