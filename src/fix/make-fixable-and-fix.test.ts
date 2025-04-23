import { describe, expect, test } from 'vitest';
import { FixTester } from '../test-util/fix-tester.js';
import type { FixToMakeFixableAndFixArgs } from './make-fixable-and-fix.js';
import { createFixToMakeFixableAndFix } from './make-fixable-and-fix.js';

const tester = new FixTester<FixToMakeFixableAndFixArgs>(
  createFixToMakeFixableAndFix,
  {
    fixableMaker: (_message, node) => {
      if (!node || !node.range) return null;
      return {
        range: [node.range[0], node.range[0]],
        text: '/* test */',
      };
    },
  },
  { parserOptions: { ecmaVersion: 2020, ecmaFeatures: { jsx: true } } },
);

describe('make-fixable-and-fix', () => {
  test('basic', async () => {
    expect(
      await tester.test({
        code: 'const a = 1;',
        rules: { 'no-unused-vars': ['error', { varsIgnorePattern: '^_' }] },
        args: {
          fixableMaker: (_message, node) => {
            if (!node || !node.range) return null;
            return { range: [node.range[0], node.range[0]], text: '_' };
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
          fixableMaker: (_message, node) => {
            if (!node || !node.range) return null;
            return { range: [node.range[0], node.range[0]], text: '_' };
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
          fixableMaker: (message, node) => {
            if (!node || !node.range) return null;
            if (message.ruleId === 'no-unused-vars') {
              return { range: [node.range[0], node.range[0]], text: '_' };
            } else if (message.ruleId === 'no-plusplus') {
              return { range: [node.range[1] - 2, node.range[1]], text: ' += 1' };
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
          fixableMaker: (_message, node) => {
            if (!node || !node.range) return null;
            return { range: [node.range[0], node.range[0]], text: '_' };
          },
        },
      }),
    ).toMatchInlineSnapshot(`"const _a = 1; const _b = 2;"`);
  });
  test('`fixableMaker` receives the message and node.', async () => {
    await tester.test({
      filename: 'test.js',
      code: ['const a = 1;'],
      rules: { 'no-unused-vars': ['error', { varsIgnorePattern: '^_' }] },
      args: {
        fixableMaker: (message, node, context) => {
          expect(message.ruleId).toBe('no-unused-vars');
          expect(node?.type).toBe('Identifier');
          expect(context.filename).toBe('test.js');
          return null;
        },
      },
    });
  });
  test('node is null if message is not associated with a node', async () => {
    await tester.test({
      code: ['// this is comment'],
      rules: { 'capitalized-comments': 'error' },
      args: {
        fixableMaker: (_message, node) => {
          expect(node).toBeNull();
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
