// @ts-check

// eslint-disable-next-line no-restricted-imports
import { baseConfig } from '../jest.config.base.mjs';

/** @type {import('@jest/types').Config.InitialOptions} */
const config = {
  ...baseConfig,
  testMatch: ['<rootDir>/**/*.test.ts?(x)'],
};

// eslint-disable-next-line import/no-default-export
export default config;
