import { ESLint } from 'eslint';
import {
  scanUsedPluginsFromResults,
  createCommentNodeText,
  parseCommentAsESLintDisableComment,
  filterResultsByRuleId,
} from '../../src/util/eslint';
import { fakeLintMessage, fakeLintResult } from '../test-util/eslint';

test('scanUsedPluginsFromResults', () => {
  const results: ESLint.LintResult[] = [
    fakeLintResult({
      messages: [
        fakeLintMessage({ ruleId: 'rule', severity: 2 }),
        fakeLintMessage({ ruleId: 'plugin/rule', severity: 2 }),
        fakeLintMessage({ ruleId: '@scoped/plugin/rule', severity: 2 }),
        fakeLintMessage({ ruleId: 'invalid/@scoped/plugin/rule', severity: 2 }),
      ],
    }),
  ];
  expect(scanUsedPluginsFromResults(results)).toStrictEqual(['plugin', '@scoped/plugin']);
});

test('filterResultsByRuleId', () => {
  const results: ESLint.LintResult[] = [
    fakeLintResult({
      messages: [
        fakeLintMessage({ ruleId: 'a' }),
        fakeLintMessage({ ruleId: 'a' }),
        fakeLintMessage({ ruleId: 'b' }),
        fakeLintMessage({ ruleId: null }),
      ],
    }),
    fakeLintResult({
      messages: [fakeLintMessage({ ruleId: 'a' })],
    }),
  ];
  const actual = filterResultsByRuleId(results, ['a', null]);
  const expected: ESLint.LintResult[] = [
    fakeLintResult({
      messages: [fakeLintMessage({ ruleId: 'a' }), fakeLintMessage({ ruleId: 'a' }), fakeLintMessage({ ruleId: null })],
    }),
    fakeLintResult({
      messages: [fakeLintMessage({ ruleId: 'a' })],
    }),
  ];
  expect(actual).toStrictEqual(expected);
});

describe('parseCommentAsESLintDisableComment', () => {
  describe('disable comment の時', () => {
    test('basic', () => {
      expect(parseCommentAsESLintDisableComment({ type: 'Line', value: ' eslint-disable-next-line a' })).toStrictEqual({
        type: 'Line',
        ruleIds: ['a'],
      });
      expect(
        parseCommentAsESLintDisableComment({ type: 'Block', value: ' eslint-disable-next-line a ' }),
      ).toStrictEqual({
        type: 'Block',
        ruleIds: ['a'],
      });
    });
    test('先頭や末尾の空白は省略できる', () => {
      expect(parseCommentAsESLintDisableComment({ type: 'Line', value: 'eslint-disable-next-line a' })).toStrictEqual({
        type: 'Line',
        ruleIds: ['a'],
      });
      expect(parseCommentAsESLintDisableComment({ type: 'Block', value: 'eslint-disable-next-line a' })).toStrictEqual({
        type: 'Block',
        ruleIds: ['a'],
      });
    });
    test('複数の ruleId をパースできる', () => {
      expect(
        parseCommentAsESLintDisableComment({ type: 'Line', value: ' eslint-disable-next-line a, b, c' }),
      ).toStrictEqual({
        type: 'Line',
        ruleIds: ['a', 'b', 'c'],
      });
      expect(
        parseCommentAsESLintDisableComment({ type: 'Line', value: ' eslint-disable-next-line a,b,c' }),
      ).toStrictEqual({
        type: 'Line',
        ruleIds: ['a', 'b', 'c'],
      });
      expect(
        parseCommentAsESLintDisableComment({ type: 'Line', value: ' eslint-disable-next-line a, b, c,' }),
      ).toStrictEqual({
        type: 'Line',
        ruleIds: ['a', 'b', 'c'],
      });
      expect(
        parseCommentAsESLintDisableComment({ type: 'Line', value: ' eslint-disable-next-line a, b,, c' }),
      ).toStrictEqual({
        type: 'Line',
        ruleIds: ['a', 'b', 'c'],
      });
    });
    test('description をパースできる', () => {
      expect(
        parseCommentAsESLintDisableComment({ type: 'Line', value: ' eslint-disable-next-line a -- foo bar' }),
      ).toStrictEqual({
        type: 'Line',
        ruleIds: ['a'],
        description: 'foo bar',
      });
      expect(
        parseCommentAsESLintDisableComment({ type: 'Line', value: ' eslint-disable-next-line a --  foo ' }),
      ).toStrictEqual({
        type: 'Line',
        ruleIds: ['a'],
        description: 'foo',
      });
      expect(
        parseCommentAsESLintDisableComment({ type: 'Line', value: ' eslint-disable-next-line a -- b -- c' }),
      ).toStrictEqual({
        type: 'Line',
        ruleIds: ['a'],
        description: 'b -- c',
      });
      expect(
        parseCommentAsESLintDisableComment({ type: 'Line', value: ' eslint-disable-next-line a , - , b -- c' }),
      ).toStrictEqual({
        type: 'Line',
        ruleIds: ['a', '-', 'b'],
        description: 'c',
      });
    });
    test('\\s で定義されるホワイトスペース文字を処理できる', () => {
      expect(
        parseCommentAsESLintDisableComment({
          type: 'Line',
          value: '\r\teslint-disable-next-line\r\ta,\r\tb\r\t--\r\tfoo\r\t',
        }),
      ).toStrictEqual({
        type: 'Line',
        ruleIds: ['a', 'b'],
        description: 'foo',
      });
    });
  });
  test('disable comment でない時', () => {
    expect(
      parseCommentAsESLintDisableComment({
        type: 'Line',
        value: 'eslint-disable-next-line',
      }),
    ).toStrictEqual(null);
    expect(
      parseCommentAsESLintDisableComment({
        type: 'Line',
        value: 'eslint-disable-next-linea',
      }),
    ).toStrictEqual(null);
    expect(
      parseCommentAsESLintDisableComment({
        type: 'Line',
        value: 'foo',
      }),
    ).toStrictEqual(null);
  });
});

describe('createCommentNodeText', () => {
  test('Line 形式のコメントが作成できる', () => {
    expect(createCommentNodeText({ type: 'Line', ruleIds: ['a', 'b'] })).toMatchInlineSnapshot(
      `"// eslint-disable-next-line a, b"`,
    );
    expect(createCommentNodeText({ type: 'Line', ruleIds: ['a', 'b'], description: 'foo' })).toMatchInlineSnapshot(
      `"// eslint-disable-next-line a, b -- foo"`,
    );
  });
  test('Block 形式のコメントが作成できる', () => {
    expect(createCommentNodeText({ type: 'Block', ruleIds: ['a', 'b'] })).toMatchInlineSnapshot(
      `"/* eslint-disable-next-line a, b */"`,
    );
    expect(createCommentNodeText({ type: 'Block', ruleIds: ['a', 'b'], description: 'foo' })).toMatchInlineSnapshot(
      `"/* eslint-disable-next-line a, b -- foo */"`,
    );
  });
});
