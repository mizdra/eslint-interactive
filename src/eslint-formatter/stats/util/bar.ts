import chalk from 'chalk';

export function getString(
  length: number,
  color: 'bgRed' | 'bgYellow' | 'hidden',
) {
  return chalk[color](' '.repeat(length));
}
