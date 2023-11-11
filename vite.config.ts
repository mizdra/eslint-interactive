import { defineConfig, configDefaults } from 'vitest/config';
import GithubActionsReporter from 'vitest-github-actions-reporter';

// eslint-disable-next-line import/no-default-export
export default defineConfig({
  test: {
    exclude: [...configDefaults.exclude, 'e2e-test/**'],
    reporters: process.env['GITHUB_ACTIONS'] ? ['default', new GithubActionsReporter()] : 'default',
    cache: {
      dir: 'node_modules/.cache/vitest',
    },
    env: {
      FORCE_HYPERLINK: '1',
      NODE_OPTIONS: '--experimental-import-meta-resolve',
    },
    watchExclude: [...configDefaults.watchExclude, 'fixtures-tmp/**', 'benchmark/fixtures/**'],
  },
});
