// @ts-check
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';

const dir = join(dirname(fileURLToPath(import.meta.url)));

/** @type {() => Promise<import('@jest/types').Config.InitialOptions>} */
export const baseConfig = async () => ({
  // Since fixtures-tmp and benchmark/fixtures are rewritten during testing, if they are in the watch target, the test will be retrying infinitely.
  watchPathIgnorePatterns: [join(dir, 'fixtures-tmp'), join(dir, 'benchmark/fixtures')],
  // for ESM
  extensionsToTreatAsEsm: ['.ts'],
  moduleNameMapper: {
    // workaround for https://github.com/facebook/jest/issues/12270
    'chalk': fileURLToPath(await import.meta.resolve('chalk')),
    '#ansi-styles': fileURLToPath(await import.meta.resolve('#ansi-styles', await import.meta.resolve('chalk'))),
    '#supports-color': fileURLToPath(await import.meta.resolve('#supports-color', await import.meta.resolve('chalk'))),
    // Map `./**/xxx.js` to `./**/xxx` (for ESM)
    '^(\\.{1,2}/.*)\\.js$': '$1',
  },
});
