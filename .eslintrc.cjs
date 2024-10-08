// @ts-check
'use strict';

/** @type import('eslint').Linter.BaseConfig */
module.exports = {
  root: true,
  extends: ['@mizdra/mizdra', '@mizdra/mizdra/+node', '@mizdra/mizdra/+prettier'],
  parserOptions: {
    ecmaVersion: 2021,
  },
  env: {
    node: true,
  },
  rules: {
    'no-console': 'off',
    // 子ディレクトリ  (実際には孫など子以降を含む) のモジュールの import を禁止する
    'no-restricted-imports': [
      'error',
      {
        patterns: [
          './*/*',
          // 子ディレクトリでも index.js 経由なら許可
          '!./*/index.js',
          // 同一ディレクトリにあるモジュールは許可
          '!./*.js',

          '../*/*',
          // 兄弟ディレクトリでも index.js 経由なら許可
          '!../*/index.js',
          // 親ディレクトリの同一ディレクトリにあるモジュールは許可
          '!../*.js',

          // cli, util, eslint は別にディレクトリで境界づけたい動機もないので許可
          '!./cli/*',
          '!../cli/*',
          '!./util/*',
          '!../util/*',
          '!../../util',
          '!./eslint/*',
          '!../eslint/*',
          '!../../eslint',
        ],
      },
    ],
    // 煩い上にこれに怒られてもリファクタリングしようという気持ちにならないので off
    'max-params': 'off',
  },
  overrides: [
    // for typescript
    {
      files: ['*.ts', '*.tsx', '*.cts', '*.mts'],
      extends: ['@mizdra/mizdra/+typescript', '@mizdra/mizdra/+prettier'],
      parserOptions: {
        project: ['./tsconfig.json'],
      },
      rules: {
        '@typescript-eslint/naming-convention': 'off',
      },
    },
    // for test
    {
      files: ['src/**/*.test.{ts,tsx,cts,mts}', 'src/test-util/**/*.{ts,tsx,cts,mts}'],
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
    // for benchmark
    {
      files: ['benchmark/**/*.{ts,tsx,cts,mts,js}'],
      rules: {
        'no-restricted-imports': 'off',
      },
    },
  ],
};
