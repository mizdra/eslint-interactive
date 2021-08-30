import { parseCommentAsESLintDisableComment } from '../../src/util/comment';

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
