import boxen from 'boxen';

/**
 * Log a warning message to the console.
 * @param message The message to warn
 */
export function warn(message: string) {
  console.log(
    boxen(message, { title: 'WARNING', borderColor: 'yellow', padding: { top: 0, left: 1, right: 1, bottom: 0 } }),
  );
}
