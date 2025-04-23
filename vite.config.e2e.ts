import { configDefaults,defineConfig } from 'vitest/config';
import { baseConfig } from './vite.config.base.js';

// eslint-disable-next-line import/no-default-export
export default defineConfig({
  ...baseConfig,
  test: {
    ...baseConfig.test,
    exclude: [...configDefaults.exclude, 'src/**'],
  },
});
