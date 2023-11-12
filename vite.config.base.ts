import { defineConfig, configDefaults } from 'vitest/config';
import GithubActionsReporter from 'vitest-github-actions-reporter';

export const baseConfig = defineConfig({
  test: {
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
