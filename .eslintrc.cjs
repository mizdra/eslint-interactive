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
    // 子ディレクトリ  (実際には孫など子以降を含む) のモジュールの import を禁止する
    'no-restricted-imports': [
      'error',
      {
        patterns: [
          './**/*',
          // 子ディレクトリでも index.js 経由なら許可
          '!./*/index.js',
          // 同一ディレクトリにあるモジュールは許可
          '!./*',
          // cli と util は別にディレクトリで境界づけたい動機もないので許可
          '!./**/cli/*',
          '!./**/util/*',
        ],
      },
    ],
  },
  overrides: [
    // for typescript
    {
      files: ['*.ts', '*.tsx', '*.cts', '*.mts'],
      parserOptions: {
        project: ['./tsconfig.src.json', './tsconfig.test.json', './e2e-test/import-as-esm-from-esm/tsconfig.json'],
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
      files: ['test/**/*.{ts,tsx,cts,mts}'],
      env: {
        jest: true,
      },
      rules: {
        'no-restricted-imports': 'off',
      },
    },
    // for e2e test
    {
      files: ['e2e-test/**/*.{ts,tsx,cts,mts}'],
      rules: {
        // test/e2e/node_modules/ だけでなく、node_modules/ からの import も許可する
        'import/no-extraneous-dependencies': ['error', { packageDir: ['.', './e2e-test/import-as-esm-from-esm'] }],
      },
    },
  ],
};
