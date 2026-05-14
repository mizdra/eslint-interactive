import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import { defineConfig } from 'vitest/config';

// Using `resolve('scripts/register-eslint-hook.mjs')` causes tests to fail on Windows.
// The value returned by `resolve(...)` is in the format `C:\Users\...\foo.mjs`,
// but the `--import` option expects a URL format. We must convert the file path to a URL.
const hookUrl = pathToFileURL(resolve('scripts/register-eslint-hook.mjs')).href;

export const baseConfig = defineConfig({
  // vitest does not propagate parent `--import` flags or `NODE_OPTIONS` into
  // its worker, so `test.env.NODE_OPTIONS` cannot register a module hook inside
  // the worker. Therefore, we use `resolve.alias` to switch the ESLint version.
  ...(process.env['ESLINT_VERSION'] && {
    resolve: {
      alias: {
        eslint: `eslint-v${process.env['ESLINT_VERSION']}`,
      },
    },
  }),
  test: {
    reporters: process.env['GITHUB_ACTIONS'] ? ['default', 'github-actions'] : 'default',
    env: {
      FORCE_HYPERLINK: '1',
      FORCE_COLOR: '1',
      NODE_OPTIONS: `--import=${hookUrl}`,
    },
  },
});
