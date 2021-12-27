// @ts-check

/** @typedef {import('ts-jest/dist/types')} */
/** @type {import('@jest/types').Config.InitialOptions} */
module.exports = {
  displayName: 'test',
  preset: 'ts-jest',
  testMatch: ['<rootDir>/test/**/*.test.ts?(x)'],
  // Since fixtures are rewritten during testing, if they are in the watch target, the test will be retrying infinitely.
  watchPathIgnorePatterns: ['<rootDir>/fixtures/'],
  // ESLint v8 では `pkg.exports` を利用したモジュールに依存しているが、jest は `pkg.exports` を解釈できないため、
  // そのままだと jest がコケてしまう。そこで `moduleNameMapper` を使って無理やりモジュール名を解決している。
  moduleNameMapper: {
    '@eslint/eslintrc/universal': '@eslint/eslintrc/dist/eslintrc-universal.cjs',
  },
  collectCoverageFrom: ['<rootDir>/src/**/*.{ts,tsx}', '!**/*.d.ts'],
  globals: {
    'ts-jest': {
      tsconfig: 'tsconfig.test.json',
    },
  },
};
