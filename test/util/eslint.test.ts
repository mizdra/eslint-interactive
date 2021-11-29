import { ESLint } from 'eslint';
import { scanUsedPluginsFromResults, createCommentNodeText, parseESLintDisableComment } from '../../src/util/eslint';
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

describe('parseESLintDisableComment', () => {
  describe('disable comment の時', () => {
    test('basic', () => {
      expect(parseESLintDisableComment({ type: 'Line', value: ' eslint-disable-next-line a' })).toStrictEqual({
        type: 'Line',
        scope: 'next-line',
        ruleIds: ['a'],
      });
      expect(parseESLintDisableComment({ type: 'Block', value: ' eslint-disable-next-line a ' })).toStrictEqual({
        type: 'Block',
        scope: 'next-line',
        ruleIds: ['a'],
      });
    });
    test('先頭や末尾の空白は省略できる', () => {
      expect(parseESLintDisableComment({ type: 'Line', value: 'eslint-disable-next-line a' })).toStrictEqual({
        type: 'Line',
        scope: 'next-line',
        ruleIds: ['a'],
      });
      expect(parseESLintDisableComment({ type: 'Block', value: 'eslint-disable-next-line a' })).toStrictEqual({
        type: 'Block',
        scope: 'next-line',
        ruleIds: ['a'],
      });
    });
    test('複数の ruleId をパースできる', () => {
      expect(parseESLintDisableComment({ type: 'Line', value: ' eslint-disable-next-line a, b, c' })).toStrictEqual({
        type: 'Line',
        scope: 'next-line',
        ruleIds: ['a', 'b', 'c'],
      });
      expect(parseESLintDisableComment({ type: 'Line', value: ' eslint-disable-next-line a,b,c' })).toStrictEqual({
        type: 'Line',
        scope: 'next-line',
        ruleIds: ['a', 'b', 'c'],
      });
      expect(parseESLintDisableComment({ type: 'Line', value: ' eslint-disable-next-line a, b, c,' })).toStrictEqual({
        type: 'Line',
        scope: 'next-line',
        ruleIds: ['a', 'b', 'c'],
      });
      expect(parseESLintDisableComment({ type: 'Line', value: ' eslint-disable-next-line a, b,, c' })).toStrictEqual({
        type: 'Line',
        scope: 'next-line',
        ruleIds: ['a', 'b', 'c'],
      });
    });
    test('description をパースできる', () => {
      expect(
        parseESLintDisableComment({ type: 'Line', value: ' eslint-disable-next-line a -- foo bar' }),
      ).toStrictEqual({
        type: 'Line',
        scope: 'next-line',
        ruleIds: ['a'],
        description: 'foo bar',
      });
      expect(parseESLintDisableComment({ type: 'Line', value: ' eslint-disable-next-line a --  foo ' })).toStrictEqual({
        type: 'Line',
        scope: 'next-line',
        ruleIds: ['a'],
        description: 'foo',
      });
      expect(parseESLintDisableComment({ type: 'Line', value: ' eslint-disable-next-line a -- b -- c' })).toStrictEqual(
        {
          type: 'Line',
          scope: 'next-line',
          ruleIds: ['a'],
          description: 'b -- c',
        },
      );
      expect(
        parseESLintDisableComment({ type: 'Line', value: ' eslint-disable-next-line a , - , b -- c' }),
      ).toStrictEqual({
        type: 'Line',
        scope: 'next-line',
        ruleIds: ['a', '-', 'b'],
        description: 'c',
      });
    });
    test('\\s で定義されるホワイトスペース文字を処理できる', () => {
      expect(
        parseESLintDisableComment({
          type: 'Line',
          value: '\r\teslint-disable-next-line\r\ta,\r\tb\r\t--\r\tfoo\r\t',
        }),
      ).toStrictEqual({
        type: 'Line',
        scope: 'next-line',
        ruleIds: ['a', 'b'],
        description: 'foo',
      });
    });
    test('eslint-disable 形式のコメントもパースできる', () => {
      expect(parseESLintDisableComment({ type: 'Line', value: ' eslint-disable a' })).toStrictEqual({
        type: 'Line',
        scope: 'file',
        ruleIds: ['a'],
      });
    });
  });
  test('disable comment でない時', () => {
    expect(
      parseESLintDisableComment({
        type: 'Line',
        value: 'eslint-disable-next-line',
      }),
    ).toStrictEqual(null);
    expect(
      parseESLintDisableComment({
        type: 'Line',
        value: 'eslint-disable-next-linea',
      }),
    ).toStrictEqual(null);
    expect(
      parseESLintDisableComment({
        type: 'Line',
        value: 'foo',
      }),
    ).toStrictEqual(null);
  });
});

describe('createCommentNodeText', () => {
  test('Line 形式のコメントが作成できる', () => {
    expect(createCommentNodeText({ type: 'Line', scope: 'next-line', ruleIds: ['a', 'b'] })).toMatchInlineSnapshot(
      `"// eslint-disable-next-line a, b"`,
    );
    expect(
      createCommentNodeText({ type: 'Line', scope: 'next-line', ruleIds: ['a', 'b'], description: 'foo' }),
    ).toMatchInlineSnapshot(`"// eslint-disable-next-line a, b -- foo"`);
  });
  test('Block 形式のコメントが作成できる', () => {
    expect(createCommentNodeText({ type: 'Block', scope: 'next-line', ruleIds: ['a', 'b'] })).toMatchInlineSnapshot(
      `"/* eslint-disable-next-line a, b */"`,
    );
    expect(
      createCommentNodeText({ type: 'Block', scope: 'next-line', ruleIds: ['a', 'b'], description: 'foo' }),
    ).toMatchInlineSnapshot(`"/* eslint-disable-next-line a, b -- foo */"`);
  });
  test('file 全体に適用される disable コメントが作成できる', () => {
    expect(
      createCommentNodeText({ type: 'Line', scope: 'file', ruleIds: ['a', 'b'], description: 'foo' }),
    ).toMatchInlineSnapshot(`"// eslint-disable a, b -- foo"`);
  });
});
