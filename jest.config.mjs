// @ts-check

import { baseConfig } from './jest.config.base.mjs';

/** @type {() => Promise<import('@jest/types').Config.InitialOptions>} */
const config = async () => ({
  ...(await baseConfig()),
  testMatch: ['<rootDir>/src/**/*.test.ts?(x)'],
});

// eslint-disable-next-line import/no-default-export
export default config;
