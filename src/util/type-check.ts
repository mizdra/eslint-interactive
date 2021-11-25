/* istanbul ignore next */
export function unreachable(): never {
  throw new Error('unreachable code');
}

export function notEmpty<TValue>(value: TValue | null | undefined): value is TValue {
  return value !== null && value !== undefined;
}
