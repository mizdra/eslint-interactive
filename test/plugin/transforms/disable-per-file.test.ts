import { createTransformToDisablePerFile } from '../../../src/plugin/transforms/disable-per-file.js';
import { TransformTester } from '../../test-util/transform-tester.js';

const tester = new TransformTester(
  createTransformToDisablePerFile,
  {},
  { parserOptions: { ecmaVersion: 2020, ecmaFeatures: { jsx: true } } },
);

describe('disable-per-file', () => {
  test('basic', () => {
    expect(
      tester.test({
        code: 'var val',
        ruleIdsToTransform: ['semi'],
      }),
    ).toMatchInlineSnapshot(`
      "/* eslint-disable semi */
      var val"
    `);
  });
  test('複数の rule を同時に disable できる', () => {
    expect(
      tester.test({
        code: 'var val',
        ruleIdsToTransform: ['semi', 'no-var'],
      }),
    ).toMatchInlineSnapshot(`
      "/* eslint-disable no-var, semi */
      var val"
    `);
  });
  test('既に disable comment が付いている場合は、末尾に足す', () => {
    expect(
      tester.test({
        code: ['/* eslint-disable semi */', 'var val'],
        ruleIdsToTransform: ['no-var'],
      }),
    ).toMatchInlineSnapshot(`
      "/* eslint-disable semi, no-var */
      var val"
    `);
  });
  test('disable description があっても disable できる', () => {
    expect(
      tester.test({
        code: ['/* eslint-disable semi -- comment */', 'var val'],
        ruleIdsToTransform: ['no-var'],
      }),
    ).toMatchInlineSnapshot(`
      "/* eslint-disable semi, no-var -- comment */
      var val"
    `);
  });
  test('disable description を追加できる', () => {
    expect(
      tester.test({
        code: ['/* eslint-disable semi */', 'var val'],
        ruleIdsToTransform: ['no-var'],
        args: { description: 'comment' },
      }),
    ).toMatchInlineSnapshot(`
      "/* eslint-disable semi, no-var -- comment */
      var val"
    `);
  });
  test('既に disable description があるコメントに対しても disable description を追加できる', () => {
    expect(
      tester.test({
        code: ['/* eslint-disable semi -- foo */', 'var val'],
        ruleIdsToTransform: ['no-var'],
        args: { description: 'bar' },
      }),
    ).toMatchInlineSnapshot(`
      "/* eslint-disable semi, no-var -- foo, bar */
      var val"
    `);
  });
  test('`eslint-disable` has precedence over `@ts-check`', () => {
    expect(
      tester.test({
        code: ['// @ts-check', 'var val'],
        ruleIdsToTransform: ['no-var'],
      }),
    ).toMatchInlineSnapshot(`
      "/* eslint-disable no-var */
      // @ts-check
      var val"
    `);
  });
  test('`eslint-disable` has precedence over `/* @jsxImportSource xxx */`', () => {
    expect(
      tester.test({
        code: ['/* @jsxImportSource @emotion/react */', 'var val'],
        ruleIdsToTransform: ['no-var'],
      }),
    ).toMatchInlineSnapshot(`
      "/* eslint-disable no-var */
      /* @jsxImportSource @emotion/react */
      var val"
    `);
  });
  test('The shebang has precedence over `eslint-disable`', () => {
    expect(
      tester.test({
        code: ['#!/usr/bin/env node', 'var val'],
        ruleIdsToTransform: ['no-var'],
      }),
    ).toMatchInlineSnapshot(`
      "#!/usr/bin/env node
      /* eslint-disable no-var */
      var val"
    `);
  });
});
