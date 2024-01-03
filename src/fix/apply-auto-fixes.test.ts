import { describe, expect, test } from 'vitest';
import { FixTester } from '../test-util/fix-tester.js';
import { createFixToApplyAutoFixes } from './apply-auto-fixes.js';

const tester = new FixTester(
  createFixToApplyAutoFixes,
  {},
  { parserOptions: { ecmaVersion: 2020, ecmaFeatures: { jsx: true, globalReturn: true } } },
);

describe('apply-auto-fixes', () => {
  test('basic', () => {
    expect(
      tester.test({
        code: 'var val',
        rules: { semi: 'error' },
      }),
    ).toMatchInlineSnapshot(`"var val;"`);
  });
  test('同一行にて複数の rule を同時に fix できる', () => {
    expect(
      tester.test({
        code: 'var val',
        rules: { 'semi': 'error', 'no-var': 'error' },
      }),
    ).toMatchInlineSnapshot(`"let val;"`);
  });
  test('複数行を同時に fix できる', () => {
    expect(
      tester.test({
        code: ['var val1', 'var val2', '', 'var val3'],
        rules: { semi: 'error' },
      }),
    ).toMatchInlineSnapshot(`
      "var val1;
      var val2;

      var val3;"
    `);
  });
  test('fixable な problem がない場合は何もしない', () => {
    expect(
      tester.test({
        code: 'var val;',
        rules: { semi: 'error' },
      }),
    ).toMatchInlineSnapshot(`null`);
  });
});
