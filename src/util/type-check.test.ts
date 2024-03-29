import { expect, test } from 'vitest';
import { notEmpty } from './type-check.js';

test('notEmpty', () => {
  expect(notEmpty('')).toStrictEqual(true);
  expect(notEmpty(0)).toStrictEqual(true);
  expect(notEmpty(false)).toStrictEqual(true);
  expect(notEmpty(null)).toStrictEqual(false);
  expect(notEmpty(undefined)).toStrictEqual(false);
});
