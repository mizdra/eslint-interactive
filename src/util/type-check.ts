/* istanbul ignore next */
export function unreachable(message?: string): never {
  throw new Error(message ?? 'unreachable code');
}

export function notEmpty<TValue>(value: TValue | null | undefined): value is TValue {
  return value !== null && value !== undefined;
}
