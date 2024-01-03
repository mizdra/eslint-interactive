import { describe, expect, test } from 'vitest';
import { FixTester } from '../../test-util/fix-tester.js';
import { createFixToConvertErrorToWarningPerFile } from './convert-error-to-warning-per-file.js';

const tester = new FixTester(
  createFixToConvertErrorToWarningPerFile,
  {},
  { parserOptions: { ecmaVersion: 2020, ecmaFeatures: { jsx: true } } },
);

describe('convert-error-to-warning-per-file', () => {
  test('basic', async () => {
    expect(
      await tester.test({
        code: 'var val',
        rules: { semi: 'error' },
      }),
    ).toMatchInlineSnapshot(`
      "/* eslint semi: 1 */
      var val"
    `);
  });
  test('fixes multiple rules', async () => {
    expect(
      await tester.test({
        code: 'var val',
        rules: { 'semi': 'error', 'no-var': 'error' },
      }),
    ).toMatchInlineSnapshot(`
      "/* eslint no-var: 1, semi: 1 */
      var val"
    `);
  });
  test('can add description', async () => {
    expect(
      await tester.test({
        code: 'var val',
        rules: { semi: 'error' },
        args: { description: 'comment' },
      }),
    ).toMatchInlineSnapshot(`
      "/* eslint semi: 1 -- comment */
      var val"
    `);
  });
  test('ignores warnings', async () => {
    expect(
      await tester.test({
        code: ['/* eslint semi: 1 */', 'var val'],
        rules: { semi: 'error' },
      }),
    ).toMatchInlineSnapshot(`null`);
  });
  test('combines directives into one', async () => {
    expect(
      await tester.test({
        code: ['var val', 'var val'],
        rules: { semi: 'error' },
      }),
    ).toMatchInlineSnapshot(`
      "/* eslint semi: 1 */
      var val
      var val"
    `);
  });
  test('`eslint` directive has precedence over `@ts-check`', async () => {
    expect(
      await tester.test({
        code: ['// @ts-check', 'var val'],
        rules: { 'no-var': 'error' },
      }),
    ).toMatchInlineSnapshot(`
      "/* eslint no-var: 1 */
      // @ts-check
      var val"
    `);
  });
  test('`eslint` directive has precedence over `/* @jsxImportSource xxx */`', async () => {
    expect(
      await tester.test({
        code: ['/* @jsxImportSource @emotion/react */', 'var val'],
        rules: { 'no-var': 'error' },
      }),
    ).toMatchInlineSnapshot(`
      "/* eslint no-var: 1 */
      /* @jsxImportSource @emotion/react */
      var val"
    `);
  });
  test('The shebang has precedence over `eslint` directive', async () => {
    expect(
      await tester.test({
        code: ['#!/usr/bin/env node', 'var val'],
        rules: { 'no-var': 'error' },
      }),
    ).toMatchInlineSnapshot(`
      "#!/usr/bin/env node
      /* eslint no-var: 1 */
      var val"
    `);
  });
});
