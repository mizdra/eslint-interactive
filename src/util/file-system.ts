import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { VERSION } from '../cli/package.js';

/**
 * Get the path of the temporary directory for eslint-interactive.
 */
export function getTempDir(): string {
  return join(tmpdir(), 'eslint-interactive', VERSION);
}
