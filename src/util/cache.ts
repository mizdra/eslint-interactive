import { tmpdir } from 'os';
import { join } from 'path';
import { VERSION } from '../cli/package.js';

/**
 * Get the path of cache directory for eslint-interactive.
 */
export function getCacheDir(): string {
  return join(tmpdir(), `eslint-interactive-${VERSION}`);
}
