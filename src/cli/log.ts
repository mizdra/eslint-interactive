// eslint-disable-next-line n/no-unsupported-features/node-builtins
import { styleText } from 'node:util';
import { taskLog } from '@clack/prompts';

/**
 * Log an error message to stderr
 * @param message The message to report
 */
export function error(message: string) {
  process.stderr.write(styleText('red', 'Error') + ': ' + message + '\n');
}

export async function withProgress<T>(taskName: 'Linting' | 'Fixing' | 'Undoing', cb: () => Promise<T>): Promise<T> {
  const log = taskLog({
    title: `${taskName}...`,
  });
  startProgress();
  try {
    const result = await cb();
    log.success(`${taskName} completed.`);
    return result;
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
