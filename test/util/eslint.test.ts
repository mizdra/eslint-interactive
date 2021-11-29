import { ESLint } from 'eslint';
import { scanUsedPluginsFromResults, createCommentNodeText, parseDisableComment } from '../../src/util/eslint';
import { fakeLintMessage, fakeLintResult } from '../test-util/eslint';

const range: [number, number] = [0, 1];

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

describe('parseDisableComment', () => {
  describe('disable comment の時', () => {
    test('basic', () => {
      expect(parseDisableComment({ type: 'Line', value: ' eslint-disable-next-line a', range })).toStrictEqual({
        type: 'Line',
        scope: 'next-line',
        ruleIds: ['a'],
        range,
      });
      expect(parseDisableComment({ type: 'Block', value: ' eslint-disable-next-line a ', range })).toStrictEqual({
        type: 'Block',
        scope: 'next-line',
        ruleIds: ['a'],
        range,
      });
    });
    test('先頭や末尾の空白は省略できる', () => {
      expect(parseDisableComment({ type: 'Line', value: 'eslint-disable-next-line a', range })).toStrictEqual({
        type: 'Line',
        scope: 'next-line',
        ruleIds: ['a'],
        range,
      });
      expect(parseDisableComment({ type: 'Block', value: 'eslint-disable-next-line a', range })).toStrictEqual({
        type: 'Block',
        scope: 'next-line',
        ruleIds: ['a'],
        range,
      });
    });
    test('複数の ruleId をパースできる', () => {
      expect(parseDisableComment({ type: 'Line', value: ' eslint-disable-next-line a, b, c', range })).toStrictEqual({
        type: 'Line',
        scope: 'next-line',
        ruleIds: ['a', 'b', 'c'],
        range,
      });
      expect(parseDisableComment({ type: 'Line', value: ' eslint-disable-next-line a,b,c', range })).toStrictEqual({
        type: 'Line',
        scope: 'next-line',
        ruleIds: ['a', 'b', 'c'],
        range,
      });
      expect(parseDisableComment({ type: 'Line', value: ' eslint-disable-next-line a, b, c,', range })).toStrictEqual({
        type: 'Line',
        scope: 'next-line',
        ruleIds: ['a', 'b', 'c'],
        range,
      });
      expect(parseDisableComment({ type: 'Line', value: ' eslint-disable-next-line a, b,, c', range })).toStrictEqual({
        type: 'Line',
        scope: 'next-line',
        ruleIds: ['a', 'b', 'c'],
        range,
      });
    });
    test('description をパースできる', () => {
      expect(
        parseDisableComment({ type: 'Line', value: ' eslint-disable-next-line a -- foo bar', range }),
      ).toStrictEqual({
        type: 'Line',
        scope: 'next-line',
        ruleIds: ['a'],
        description: 'foo bar',
        range,
      });
      expect(parseDisableComment({ type: 'Line', value: ' eslint-disable-next-line a --  foo ', range })).toStrictEqual(
        {
          type: 'Line',
          scope: 'next-line',
          ruleIds: ['a'],
          description: 'foo',
          range,
        },
      );
      expect(
        parseDisableComment({ type: 'Line', value: ' eslint-disable-next-line a -- b -- c', range }),
      ).toStrictEqual({
        type: 'Line',
        scope: 'next-line',
        ruleIds: ['a'],
        description: 'b -- c',
        range,
      });
      expect(
        parseDisableComment({ type: 'Line', value: ' eslint-disable-next-line a , - , b -- c', range }),
      ).toStrictEqual({
        type: 'Line',
        scope: 'next-line',
        ruleIds: ['a', '-', 'b'],
        description: 'c',
        range,
      });
    });
    test('\\s で定義されるホワイトスペース文字を処理できる', () => {
      expect(
        parseDisableComment({
          type: 'Line',
          value: '\r\teslint-disable-next-line\r\ta,\r\tb\r\t--\r\tfoo\r\t',
          range,
        }),
      ).toStrictEqual({
        type: 'Line',
        scope: 'next-line',
        ruleIds: ['a', 'b'],
        description: 'foo',
        range,
      });
    });
    test('eslint-disable 形式のコメントもパースできる', () => {
      expect(parseDisableComment({ type: 'Line', value: ' eslint-disable a', range })).toStrictEqual({
        type: 'Line',
        scope: 'file',
        ruleIds: ['a'],
        range,
      });
    });
  });
  test('disable comment でない時', () => {
    expect(
      parseDisableComment({
        type: 'Line',
        value: 'eslint-disable-next-line',
        range,
      }),
    ).toStrictEqual(undefined);
    expect(
      parseDisableComment({
        type: 'Line',
        value: 'eslint-disable-next-linea',
        range,
      }),
    ).toStrictEqual(undefined);
    expect(
      parseDisableComment({
        type: 'Line',
        value: 'foo',
        range,
      }),
    ).toStrictEqual(undefined);
  });
  test('range が無い時', () => {
    expect(
      parseDisableComment({
        type: 'Line',
        value: 'eslint-disable-next-line a',
      }),
    ).toStrictEqual(undefined);
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
