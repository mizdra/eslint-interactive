import { join } from 'path';
import cachedir from 'cachedir';
import { VERSION } from '../cli/package.js';

/**
 * Get the path of cache directory for eslint-interactive.
 */
export function getCacheDir(): string {
  return join(cachedir('eslint-interactive'), VERSION);
}
