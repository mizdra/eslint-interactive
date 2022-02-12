import { oraPromise } from 'ora';

export async function lintingSpinner<T>(cb: () => Promise<T>): Promise<T> {
  return oraPromise(cb, {
    text: 'Linting...',
    spinner: 'clock',
    successText: 'Linting was successful.',
  });
}

export async function fixingSpinner<T>(cb: () => Promise<T>): Promise<T> {
  return oraPromise(cb, {
    text: 'Fixing...',
    spinner: 'clock',
    successText: 'Fixing was successful.',
  });
}

export async function undoingSpinner<T>(cb: () => Promise<T>): Promise<T> {
  return oraPromise(cb, {
    text: 'Undoing...',
    spinner: 'timeTravel',
    successText: 'Undoing was successful.',
  });
}
