import { defineConfig } from 'vitest/config';

export const baseConfig = defineConfig({
  cacheDir: 'node_modules/.cache/vitest',
  server: {
    watch: {
      ignored: ['**/benchmark/fixtures/**'],
    },
  },
  test: {
    reporters: process.env['GITHUB_ACTIONS'] ? ['default', 'github-actions'] : 'default',
    env: {
      FORCE_HYPERLINK: '1',
      FORCE_COLOR: '1',
    },
  },
});
