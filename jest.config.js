// @ts-check

/** @typedef {import('ts-jest/dist/types')} */
/** @type {import('@jest/types').Config.InitialOptions} */
module.exports = {
  displayName: 'test',
  preset: 'ts-jest',
  testMatch: ['<rootDir>/test/**/*.test.ts?(x)'],
  collectCoverageFrom: ['<rootDir>/src/**/*.{ts,tsx}'],
  globals: {
    'ts-jest': {
      tsconfig: 'tsconfig.test.json',
    },
  },
};
