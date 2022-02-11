import { join } from 'path';
// eslint-disable-next-line @typescript-eslint/no-require-imports
import cachedir = require('cachedir');
import { VERSION } from '../cli/package.js';

/**
 * Get the path of cache directory for eslint-interactive.
 */
export function getCacheDir(): string {
  return join(cachedir('eslint-interactive'), VERSION);
}
