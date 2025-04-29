// @ts-check
import mizdra from '@mizdra/eslint-config-mizdra';
import { globalIgnores } from 'eslint/config';

/** @type {import('eslint').Linter.Config[]} */
export default [
  globalIgnores(['dist', 'bin', 'static', 'e2e-test', 'example']),
  ...mizdra.baseConfigs,
  ...mizdra.typescriptConfigs,
  ...mizdra.nodeConfigs,
  {
    files: ['**/*.{js,jsx,mjs,cjs}', '**/*.{ts,tsx,cts,mts}'],
    rules: {
      'no-console': 'off',
      // template literal を積極的に使っても読みやすくなるとは限らないので off
      'prefer-template': 'off',
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
  mizdra.prettierConfig,
];
