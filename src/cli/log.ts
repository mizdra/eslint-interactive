// eslint-disable-next-line n/no-unsupported-features/node-builtins
import { styleText } from 'node:util';

/**
 * Log an error message to stderr
 * @param message The message to report
 */
export function error(message: string) {
  process.stderr.write(styleText('red', 'Error') + ': ' + message + '\n');
}

export async function withProgress<T>(label: string, cb: () => Promise<T>): Promise<T> {
  console.log(label);
  startProgress();
  try {
    return await cb();
  } finally {
    endProgress();
  }
}

function startProgress(): void {
  if (!process.stdout.isTTY) return;
  process.stdout.write('\x1b]9;4;3\x07');
}

function endProgress(): void {
  if (!process.stdout.isTTY) return;
  process.stdout.write('\x1b]9;4;0\x07');
}
