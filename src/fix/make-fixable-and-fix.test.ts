import { describe, expect, test } from 'vitest';
import { FixTester } from '../test-util/fix-tester.js';
import type { FixToMakeFixableAndFixArgs } from './make-fixable-and-fix.js';
import { createFixToMakeFixableAndFix } from './make-fixable-and-fix.js';

const tester = new FixTester<FixToMakeFixableAndFixArgs>(
  createFixToMakeFixableAndFix,
  {
    fixableMaker: (_message, range) => {
      return {
        range: [range[0], range[0]],
        text: '/* test */',
      };
    },
  },
  { languageOptions: { ecmaVersion: 2020, parserOptions: { ecmaFeatures: { jsx: true } } } },
);

describe('make-fixable-and-fix', () => {
  test('basic', async () => {
    expect(
      await tester.test({
        code: 'const a = 1;',
        rules: { 'no-unused-vars': ['error', { varsIgnorePattern: '^_' }] },
        args: {
          fixableMaker: (_message, range, context) => {
            return context.fixer.insertTextBeforeRange(range, '_');
          },
        },
      }),
    ).toMatchInlineSnapshot(`"const _a = 1;"`);
  });
  test('can process multiple messages at once', async () => {
    expect(
      await tester.test({
        code: ['const a = 1;', 'const b = 2;'],
        rules: { 'no-unused-vars': ['error', { varsIgnorePattern: '^_' }] },
        args: {
          fixableMaker: (_message, range, context) => {
            return context.fixer.insertTextBeforeRange(range, '_');
          },
        },
      }),
    ).toMatchInlineSnapshot(`
      "const _a = 1;
      const _b = 2;"
    `);
  });
  test('can process messages of multiple rules at once', async () => {
    expect(
      await tester.test({
        code: ['const a = 1;', 'let b = 2;', 'b++;', 'console.log(b);'],
        rules: { 'no-unused-vars': ['error', { varsIgnorePattern: '^_' }], 'no-plusplus': 'error' },
        args: {
          fixableMaker: (message, range, context) => {
            if (message.ruleId === 'no-unused-vars') {
              return context.fixer.insertTextBeforeRange(range, '_');
            } else if (message.ruleId === 'no-plusplus') {
              return context.fixer.replaceTextRange([range[1] - 2, range[1]], ' += 1');
            } else {
              return null;
            }
          },
        },
      }),
    ).toMatchInlineSnapshot(`
      "const _a = 1;
      let b = 2;
      b += 1;
      console.log(b);"
    `);
  });
  test('can process messages on the same line', async () => {
    expect(
      await tester.test({
        code: ['const a = 1; const b = 2;'],
        rules: { 'no-unused-vars': ['error', { varsIgnorePattern: '^_' }] },
        args: {
          fixableMaker: (_message, range, context) => {
            return context.fixer.insertTextBeforeRange(range, '_');
          },
        },
      }),
    ).toMatchInlineSnapshot(`"const _a = 1; const _b = 2;"`);
  });
  test('`fixableMaker` receives the message and range.', async () => {
    await tester.test({
      filename: 'test.js',
      code: ['const a = 1;'],
      rules: { 'no-unused-vars': ['error', { varsIgnorePattern: '^_' }] },
      args: {
        fixableMaker: (message, range, context) => {
          expect(message.ruleId).toBe('no-unused-vars');
          expect(range).toStrictEqual([6, 7]);
          expect(context.filename).toBe('test.js');
          return null;
        },
      },
    });
  });
  test('range is [index, index] if message does not have endLine/endColumn', async () => {
    await tester.test({
      code: ['const a = 1;'],
      rules: { 'eslint-interactive/report-without-end-location': 'error' },
      args: {
        fixableMaker: (_message, range) => {
          expect(range).toStrictEqual([0, 0]);
          return null;
        },
      },
    });
  });
  test('do not process if `fixableMaker` returns null', async () => {
    expect(
      await tester.test({
        code: 'const a = 1;',
        rules: { 'no-unused-vars': ['error', { varsIgnorePattern: '^_' }] },
        args: {
          fixableMaker: () => null,
        },
      }),
    ).toMatchInlineSnapshot(`null`);
  });
});
