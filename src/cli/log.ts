// eslint-disable-next-line n/no-unsupported-features/node-builtins
import { styleText } from 'node:util';

/**
 * Log an error message to stderr
 * @param message The message to report
 */
export function error(message: string) {
  process.stderr.write(styleText('red', 'Error') + ': ' + message + '\n');
}
