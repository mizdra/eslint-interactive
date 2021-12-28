// @ts-check

/** @typedef {import('ts-jest/dist/types')} */
/** @type {import('@jest/types').Config.InitialOptions} */
// eslint-disable-next-line import/no-default-export
export default {
  displayName: 'test',
  preset: 'ts-jest/presets/default-esm',
  testMatch: ['<rootDir>/test/**/*.test.ts?(x)'],
  // Since fixtures-tmp are rewritten during testing, if they are in the watch target, the test will be retrying infinitely.
  watchPathIgnorePatterns: ['<rootDir>/fixtures-tmp/'],
  // ESLint v8 では `pkg.exports` を利用したモジュールに依存しているが、jest は `pkg.exports` を解釈できないため、
  // そのままだと jest がコケてしまう。そこで `moduleNameMapper` を使って無理やりモジュール名を解決している。
  moduleNameMapper: {
    // Map `./**/xxx.js` to `./**/xxx` (for ESM)
    '^(\\.{1,2}/.*)\\.js$': '$1',
  },
  // for ESM
  resolver: '<rootDir>/test/test-util/jest/resolver.cjs',
  // do not transform `import` statements (for ESM)
  transform: {},
  collectCoverageFrom: ['<rootDir>/src/**/*.{js,jsx,cjs,mjs,ts,tsx,cts,mts}', '!**/*.d.ts'],
  globals: {
    'ts-jest': {
      tsconfig: 'tsconfig.test.json',
      useESM: true,
    },
  },
};
