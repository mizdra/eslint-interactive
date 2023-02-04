import { join } from 'path';
import cachedir from 'cachedir';
import findCacheDirectory from 'find-cache-dir';
import { VERSION } from '../cli/package.js';

/**
 * Get the path of cache directory for eslint-interactive.
 */
export function getCacheDir(): string {
  // If package.json exists in the parent directory of cwd,then node_modules/.cache/eslint-interactive
  // under that directory is set as the cache directory.
  // If it does not exist, the OS's cache directory is used.
  const packageCacheDir = findCacheDirectory({ name: 'eslint-interactive' }) ?? cachedir('eslint-interactive');
  return join(packageCacheDir, VERSION);
}
