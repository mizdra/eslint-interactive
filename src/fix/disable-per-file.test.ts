import { describe, expect, test } from 'vitest';
import { FixTester } from '../test-util/fix-tester.js';
import { createFixToDisablePerFile } from './disable-per-file.js';

const tester = new FixTester(
  createFixToDisablePerFile,
  {},
  { parserOptions: { ecmaVersion: 2020, ecmaFeatures: { jsx: true } } },
);

describe('disable-per-file', () => {
  test('basic', async () => {
    expect(
      await tester.test({
        code: 'var val',
        rules: { semi: 'error' },
      }),
    ).toMatchInlineSnapshot(`
      "/* eslint-disable semi */
      var val"
    `);
  });
  test('複数の rule を同時に disable できる', async () => {
    expect(
      await tester.test({
        code: 'var val',
        rules: { 'semi': 'error', 'no-var': 'error' },
      }),
    ).toMatchInlineSnapshot(`
      "/* eslint-disable no-var, semi */
      var val"
    `);
  });
  test('既に disable comment が付いている場合は、末尾に足す', async () => {
    expect(
      await tester.test({
        code: ['/* eslint-disable semi */', 'var val'],
        rules: { 'no-var': 'error' },
      }),
    ).toMatchInlineSnapshot(`
      "/* eslint-disable semi, no-var */
      var val"
    `);
  });
  test('disable description があっても disable できる', async () => {
    expect(
      await tester.test({
        code: ['/* eslint-disable semi -- comment */', 'var val'],
        rules: { 'no-var': 'error' },
      }),
    ).toMatchInlineSnapshot(`
      "/* eslint-disable semi, no-var -- comment */
      var val"
    `);
  });
  test('disable description を追加できる', async () => {
    expect(
      await tester.test({
        code: ['/* eslint-disable semi */', 'var val'],
        rules: { 'no-var': 'error' },
        args: { description: 'comment' },
      }),
    ).toMatchInlineSnapshot(`
      "/* eslint-disable semi, no-var -- comment */
      var val"
    `);
  });
  test('既に disable description があるコメントに対しても disable description を追加できる', async () => {
    expect(
      await tester.test({
        code: ['/* eslint-disable semi -- foo */', 'var val'],
        rules: { 'no-var': 'error' },
        args: { description: 'bar' },
      }),
    ).toMatchInlineSnapshot(`
      "/* eslint-disable semi, no-var -- foo, bar */
      var val"
    `);
  });
  test('add a description to the line before the disable comment if there is already disable comment', async () => {
    expect(
      await tester.test({
        code: ['/* eslint-disable semi -- foo */', 'var val'],
        rules: { 'no-var': 'error' },
        args: { description: 'bar', descriptionPosition: 'previousLine' },
      }),
    ).toMatchInlineSnapshot(`
      "// bar
      /* eslint-disable semi, no-var -- foo */
      var val"
    `);
  });
  test('add a description comment before the line with the problem', async () => {
    expect(
      await tester.test({
        code: ['var val'],
        rules: { semi: 'error' },
        args: { description: 'foo', descriptionPosition: 'previousLine' },
      }),
    ).toMatchInlineSnapshot(`
      "// foo
      /* eslint-disable semi */
      var val"
    `);
  });
  test('`eslint-disable` has precedence over `@ts-check`', async () => {
    expect(
      await tester.test({
        code: ['// @ts-check', 'var val'],
        rules: { 'no-var': 'error' },
      }),
    ).toMatchInlineSnapshot(`
      "/* eslint-disable no-var */
      // @ts-check
      var val"
    `);
  });
  test('`eslint-disable` has precedence over `/* @jsxImportSource xxx */`', async () => {
    expect(
      await tester.test({
        code: ['/* @jsxImportSource @emotion/react */', 'var val'],
        rules: { 'no-var': 'error' },
      }),
    ).toMatchInlineSnapshot(`
      "/* eslint-disable no-var */
      /* @jsxImportSource @emotion/react */
      var val"
    `);
  });
  test('The shebang has precedence over `eslint-disable`', async () => {
    expect(
      await tester.test({
        code: ['#!/usr/bin/env node', 'var val'],
        rules: { 'no-var': 'error' },
      }),
    ).toMatchInlineSnapshot(`
      "#!/usr/bin/env node
      /* eslint-disable no-var */
      var val"
    `);
  });
});
