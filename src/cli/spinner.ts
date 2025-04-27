import { createSpinner } from 'nanospinner';

export async function lintingSpinner<T>(cb: () => Promise<T>): Promise<T> {
  const spinner = createSpinner('Linting...').start();
  const result = await cb();
  spinner.success();
  return result;
}

export async function fixingSpinner<T>(cb: () => Promise<T>): Promise<T> {
  const spinner = createSpinner('Fixing...').start();
  const result = await cb();
  spinner.success();
  return result;
}

export async function undoingSpinner<T>(cb: () => Promise<T>): Promise<T> {
  const spinner = createSpinner('Undoing...').start();
  const result = await cb();
  spinner.success();
  return result;
}
