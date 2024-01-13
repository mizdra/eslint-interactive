import { defineConfig, defineWorkspace, configDefaults } from 'vitest/config';
import GithubActionsReporter from 'vitest-github-actions-reporter';

const baseConfig = defineConfig({
  test: {
    reporters: process.env['GITHUB_ACTIONS'] ? ['default', new GithubActionsReporter()] : 'default',
    cache: {
      dir: 'node_modules/.cache/vitest',
    },
    env: {
      FORCE_HYPERLINK: '1',
      FORCE_COLOR: '1',
      NODE_OPTIONS: '--experimental-import-meta-resolve',
    },
    exclude: [...configDefaults.exclude, 'tmp/**'],
    watchExclude: [...configDefaults.watchExclude, 'fixtures-tmp/**', 'tmp/**', 'benchmark/fixtures/**'],
  },
});

// eslint-disable-next-line import/no-default-export
export default defineWorkspace([
  {
    ...baseConfig,
    test: {
      ...baseConfig.test,
      name: 'unit',
      include: ['src/**/*.test.ts'],
    },
  },
  {
    ...baseConfig,
    test: {
      ...baseConfig.test,
      name: 'e2e',
      include: ['e2e-test/**/*.test.ts'],
    },
  },
]);
