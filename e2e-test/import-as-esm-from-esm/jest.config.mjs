// @ts-check

import { baseConfig } from '../../jest.config.base.mjs';

/** @typedef {import('ts-jest/dist/types')} */
/** @type {import('@jest/types').Config.InitialOptions} */
const config = {
  ...baseConfig,
  testMatch: ['<rootDir>/*.test.ts?(x)'],
  globals: {
    ...baseConfig.globals,
    'ts-jest': {
      ...baseConfig.globals['ts-jest'],
      tsconfig: '<rootDir>/tsconfig.json',
    },
  },
};

// eslint-disable-next-line import/no-default-export
export default config;
