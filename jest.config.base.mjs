// @ts-check
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';

const dir = join(dirname(fileURLToPath(import.meta.url)));

/** @type import('@jest/types').Config.InitialOptions */
export const baseConfig = {
  preset: 'ts-jest/presets/default-esm',
  // Since fixtures-tmp and benchmark/fixtures are rewritten during testing, if they are in the watch target, the test will be retrying infinitely.
  watchPathIgnorePatterns: [join(dir, 'fixtures-tmp'), join(dir, 'benchmark/fixtures')],
  // ESLint v8 では `pkg.exports` を利用したモジュールに依存しているが、jest は `pkg.exports` を解釈できないため、
  // そのままだと jest がコケてしまう。そこで `moduleNameMapper` を使って無理やりモジュール名を解決している。
  moduleNameMapper: {
    // Map `./**/xxx.js` to `./**/xxx` (for ESM)
    '^(\\.{1,2}/.*)\\.js$': '$1',
  },
  // for ESM
  resolver: join(dir, 'src/test-util/jest/resolver.cjs'),
  // do not transform `import` statements (for ESM)
  transform: {},
  globals: {
    'ts-jest': {
      // tsconfig: 'tsconfig.test.json', // need override
      useESM: true,
    },
  },
};
