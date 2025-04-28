import { styleText } from 'node:util';

/**
 * Log a warning message to stderr
 * @param message The message to warn
 */
export function warn(message: string) {
  process.stderr.write(styleText('yellow', 'Warning') + ': ' + message + '\n');
}
