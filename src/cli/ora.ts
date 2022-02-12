import { oraPromise } from 'ora';

export async function lintingSpinner<T>(cb: () => Promise<T>): Promise<T> {
  return oraPromise(cb, {
    text: 'Linting...',
    spinner: 'moon',
    successText: 'Linting was successful.',
  });
}

export async function fixingSpinner<T>(cb: () => Promise<T>): Promise<T> {
  return oraPromise(cb, {
    text: 'Fixing...',
    spinner: 'moon',
    successText: 'Fixing was successful.',
  });
}
