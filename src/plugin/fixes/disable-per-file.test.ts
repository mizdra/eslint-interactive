import { FixTester } from '../../test-util/fix-tester.js';

const tester = new FixTester(
  'disablePerFile',
  {},
  { parserOptions: { ecmaVersion: 2020, ecmaFeatures: { jsx: true } } },
);

describe('disable-per-file', () => {
  test('basic', async () => {
    expect(
      await tester.test({
        code: 'var val',
        ruleIdsToFix: ['semi'],
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
        ruleIdsToFix: ['semi', 'no-var'],
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
        ruleIdsToFix: ['no-var'],
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
        ruleIdsToFix: ['no-var'],
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
        ruleIdsToFix: ['no-var'],
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
        ruleIdsToFix: ['no-var'],
        args: { description: 'bar' },
      }),
    ).toMatchInlineSnapshot(`
      "/* eslint-disable semi, no-var -- foo, bar */
      var val"
    `);
  });
  test('`eslint-disable` has precedence over `@ts-check`', async () => {
    expect(
      await tester.test({
        code: ['// @ts-check', 'var val'],
        ruleIdsToFix: ['no-var'],
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
        ruleIdsToFix: ['no-var'],
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
        ruleIdsToFix: ['no-var'],
      }),
    ).toMatchInlineSnapshot(`
      "#!/usr/bin/env node
      /* eslint-disable no-var */
      var val"
    `);
  });
});
