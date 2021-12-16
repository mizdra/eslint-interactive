// @ts-check

/** @typedef {import('ts-jest/dist/types')} */
/** @type {import('@jest/types').Config.InitialOptions} */
export default {
  displayName: 'test',
  preset: 'ts-jest/presets/default-esm',
  testMatch: ['<rootDir>/test/**/*.test.ts?(x)'],
  moduleNameMapper: {
    // ESLint v8 では `pkg.exports` を利用したモジュールに依存しているが、jest は `pkg.exports` を解釈できないため、
    // そのままだと jest がコケてしまう。そこで `moduleNameMapper` を使って無理やりモジュール名を解決している。
    // '@eslint/eslintrc/universal': '@eslint/eslintrc/dist/eslintrc-universal.cjs',
    // 'strip-ansi': 'strip-ansi/index.js',
    // 'chalk': 'chalk/source/index.js',
    // '#ansi-styles': 'chalk/source/vendor/ansi-styles/index.js',
    // '#supports-color': 'chalk/source/vendor/supports-color/index.js',
    // Map `./**/xxx.js` to `./**/xxx` (for ESM)
    '^(\\.{1,2}/.*)\\.js$': '$1',
  },
  resolver: '<rootDir>/test/test-util/jest/resolver.cjs',
  // do not transform `import` statements (for ESM)
  transform: {},
  collectCoverageFrom: ['<rootDir>/src/**/*.{ts,tsx}', '!**/*.d.ts'],
  globals: {
    'ts-jest': {
      tsconfig: 'tsconfig.test.json',
      useESM: true,
    },
  },
};
