import { basename } from 'node:path';
import { describe, expect, test } from 'vitest';
import { FixTester } from '../test-util/fix-tester.js';
import { createFixToMakeFixableAndFix, FixToMakeFixableAndFixArgs } from './make-fixable-and-fix.js';

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
  test('basic', () => {
    expect(
      tester.test({
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
  test('can process multiple messages at once', () => {
    expect(
      tester.test({
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
  test('can process messages of multiple rules at once', () => {
    expect(
      tester.test({
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
  test('can process messages on the same line', () => {
    expect(
      tester.test({
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
  test('`fixableMaker` receives the message and node.', () => {
    tester.test({
      code: ['const a = 1;'],
      rules: { 'no-unused-vars': ['error', { varsIgnorePattern: '^_' }] },
      args: {
        fixableMaker: (message, node, context) => {
          expect({
            message,
            node,
            context: {
              ...context,
              // Use only basename, because the path will change depending on the environment.
              filename: basename(context.filename),
              // Take a snapshot of only part of it because `sourceCode` is huge
              sourceCode: { text: context.sourceCode.text },
            },
          }).toMatchSnapshot();
          return null;
        },
      },
    });
  });
  test('node is null if message is not associated with a node', () => {
    tester.test({
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
  test('do not process if `fixableMaker` returns null', () => {
    expect(
      tester.test({
        code: 'const a = 1;',
        rules: { 'no-unused-vars': ['error', { varsIgnorePattern: '^_' }] },
        args: {
          fixableMaker: () => null,
        },
      }),
    ).toMatchInlineSnapshot(`null`);
  });
});
