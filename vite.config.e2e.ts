import { configDefaults, defineConfig } from 'vitest/config';
import { baseConfig } from './vite.config.base.js';

export default defineConfig({
  ...baseConfig,
  test: {
    ...baseConfig.test,
    exclude: [...configDefaults.exclude, 'src/**'],
  },
});
