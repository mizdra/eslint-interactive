// @ts-check
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';

const dir = join(dirname(fileURLToPath(import.meta.url)));

/** @type import('@jest/types').Config.InitialOptions */
export const baseConfig = {
  // Since fixtures-tmp and benchmark/fixtures are rewritten during testing, if they are in the watch target, the test will be retrying infinitely.
  watchPathIgnorePatterns: [join(dir, 'fixtures-tmp'), join(dir, 'benchmark/fixtures')],
  // for ESM
  extensionsToTreatAsEsm: ['.ts'],
  moduleNameMapper: {
    // Map `./**/xxx.js` to `./**/xxx` (for ESM)
    '^(\\.{1,2}/.*)\\.js$': '$1',
  },
  // for ESM
  resolver: join(dir, 'src/test-util/jest/resolver.cjs'),
};
