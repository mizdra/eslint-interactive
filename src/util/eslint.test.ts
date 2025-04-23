import type { ESLint } from 'eslint';
import type { SourceLocation } from 'estree';
import { describe, expect, test } from 'vitest';
import { fakeLintMessage, fakeLintResult } from '../test-util/eslint.js';
import {
  filterResultsByRuleId,
  findShebang,
  mergeDescription,
  mergeRuleIds,
  parseDisableComment,
  toCommentText,
  toDisableCommentText,
  toInlineConfigCommentText,
} from './eslint.js';

const range: [number, number] = [0, 1];
const loc: SourceLocation = { start: { line: 1, column: 0 }, end: { line: 1, column: 1 } };

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
    fakeLintResult({
      messages: [fakeLintMessage({ ruleId: 'b' })],
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
      expect(parseDisableComment({ type: 'Line', value: ' eslint-disable-next-line a', range, loc })).toStrictEqual({
        type: 'Line',
        scope: 'next-line',
        ruleIds: ['a'],
        range,
        loc,
      });
      expect(parseDisableComment({ type: 'Block', value: ' eslint-disable-next-line a ', range, loc })).toStrictEqual({
        type: 'Block',
        scope: 'next-line',
        ruleIds: ['a'],
        range,
        loc,
      });
    });
    test('先頭や末尾の空白は省略できる', () => {
      expect(parseDisableComment({ type: 'Line', value: 'eslint-disable-next-line a', range, loc })).toStrictEqual({
        type: 'Line',
        scope: 'next-line',
        ruleIds: ['a'],
        range,
        loc,
      });
      expect(parseDisableComment({ type: 'Block', value: 'eslint-disable-next-line a', range, loc })).toStrictEqual({
        type: 'Block',
        scope: 'next-line',
        ruleIds: ['a'],
        range,
        loc,
      });
    });
    test('複数の ruleId をパースできる', () => {
      expect(
        parseDisableComment({ type: 'Line', value: ' eslint-disable-next-line a, b, c', range, loc }),
      ).toStrictEqual({
        type: 'Line',
        scope: 'next-line',
        ruleIds: ['a', 'b', 'c'],
        range,
        loc,
      });
      expect(parseDisableComment({ type: 'Line', value: ' eslint-disable-next-line a,b,c', range, loc })).toStrictEqual(
        {
          type: 'Line',
          scope: 'next-line',
          ruleIds: ['a', 'b', 'c'],
          range,
          loc,
        },
      );
      expect(
        parseDisableComment({ type: 'Line', value: ' eslint-disable-next-line a, b, c,', range, loc }),
      ).toStrictEqual({
        type: 'Line',
        scope: 'next-line',
        ruleIds: ['a', 'b', 'c'],
        range,
        loc,
      });
      expect(
        parseDisableComment({ type: 'Line', value: ' eslint-disable-next-line a, b,, c', range, loc }),
      ).toStrictEqual({
        type: 'Line',
        scope: 'next-line',
        ruleIds: ['a', 'b', 'c'],
        range,
        loc,
      });
    });
    test('description をパースできる', () => {
      expect(
        parseDisableComment({ type: 'Line', value: ' eslint-disable-next-line a -- foo bar', range, loc }),
      ).toStrictEqual({
        type: 'Line',
        scope: 'next-line',
        ruleIds: ['a'],
        description: 'foo bar',
        range,
        loc,
      });
      expect(
        parseDisableComment({ type: 'Line', value: ' eslint-disable-next-line a --  foo ', range, loc }),
      ).toStrictEqual({
        type: 'Line',
        scope: 'next-line',
        ruleIds: ['a'],
        description: 'foo',
        range,
        loc,
      });
      expect(
        parseDisableComment({ type: 'Line', value: ' eslint-disable-next-line a -- b -- c', range, loc }),
      ).toStrictEqual({
        type: 'Line',
        scope: 'next-line',
        ruleIds: ['a'],
        description: 'b -- c',
        range,
        loc,
      });
      expect(
        parseDisableComment({ type: 'Line', value: ' eslint-disable-next-line a , - , b -- c', range, loc }),
      ).toStrictEqual({
        type: 'Line',
        scope: 'next-line',
        ruleIds: ['a', '-', 'b'],
        description: 'c',
        range,
        loc,
      });
    });
    test('\\s で定義されるホワイトスペース文字を処理できる', () => {
      expect(
        parseDisableComment({
          type: 'Line',
          value: '\r\teslint-disable-next-line\r\ta,\r\tb\r\t--\r\tfoo\r\t',
          range,
          loc,
        }),
      ).toStrictEqual({
        type: 'Line',
        scope: 'next-line',
        ruleIds: ['a', 'b'],
        description: 'foo',
        range,
        loc,
      });
    });
    test('eslint-disable 形式のコメントもパースできる', () => {
      expect(parseDisableComment({ type: 'Block', value: ' eslint-disable a', range, loc })).toStrictEqual({
        type: 'Block',
        scope: 'file',
        ruleIds: ['a'],
        range,
        loc,
      });
    });
  });
  test('disable comment でない時', () => {
    expect(
      parseDisableComment({
        type: 'Line',
        value: 'eslint-disable-next-line',
        range,
        loc,
      }),
    ).toStrictEqual(undefined);
    expect(
      parseDisableComment({
        type: 'Line',
        value: 'eslint-disable-next-linea',
        range,
        loc,
      }),
    ).toStrictEqual(undefined);
    expect(
      parseDisableComment({
        type: 'Line',
        value: 'foo',
        range,
        loc,
      }),
    ).toStrictEqual(undefined);
    // file scope comment must be block-style.
    expect(parseDisableComment({ type: 'Line', value: ' eslint-disable a', range })).toStrictEqual(undefined);
  });
  test('when without range', () => {
    expect(
      parseDisableComment({
        type: 'Line',
        value: 'eslint-disable-next-line a',
        loc,
      }),
    ).toStrictEqual(undefined);
  });
  test('when without loc', () => {
    expect(
      parseDisableComment({
        type: 'Line',
        value: 'eslint-disable-next-line a',
        range,
      }),
    ).toStrictEqual(undefined);
  });
});

test('toCommentText', () => {
  expect(toCommentText({ type: 'Line', text: 'foo' })).toBe('// foo');
  expect(toCommentText({ type: 'Block', text: 'foo' })).toBe('/* foo */');
});

describe('toDisableCommentText', () => {
  test('Line 形式のコメントが作成できる', () => {
    expect(toDisableCommentText({ type: 'Line', scope: 'next-line', ruleIds: ['a', 'b'] })).toMatchInlineSnapshot(
      `"// eslint-disable-next-line a, b"`,
    );
    expect(
      toDisableCommentText({ type: 'Line', scope: 'next-line', ruleIds: ['a', 'b'], description: 'foo' }),
    ).toMatchInlineSnapshot(`"// eslint-disable-next-line a, b -- foo"`);
  });
  test('Block 形式のコメントが作成できる', () => {
    expect(toDisableCommentText({ type: 'Block', scope: 'next-line', ruleIds: ['a', 'b'] })).toMatchInlineSnapshot(
      `"/* eslint-disable-next-line a, b */"`,
    );
    expect(
      toDisableCommentText({ type: 'Block', scope: 'next-line', ruleIds: ['a', 'b'], description: 'foo' }),
    ).toMatchInlineSnapshot(`"/* eslint-disable-next-line a, b -- foo */"`);
  });
  test('file 全体に適用される disable コメントが作成できる', () => {
    expect(
      toDisableCommentText({ type: 'Line', scope: 'file', ruleIds: ['a', 'b'], description: 'foo' }),
    ).toMatchInlineSnapshot(`"// eslint-disable a, b -- foo"`);
  });
});

test('mergeRuleIds', () => {
  expect(mergeRuleIds(['a', 'b'], ['c', 'd'])).toStrictEqual(['a', 'b', 'c', 'd']);
  expect(mergeRuleIds(['a', 'b'], ['b', 'c'])).toStrictEqual(['a', 'b', 'c']);
});

test('mergeDescription', () => {
  expect(mergeDescription('foo', 'bar')).toBe('foo, bar');
  expect(mergeDescription('foo', undefined)).toBe('foo');
  expect(mergeDescription(undefined, 'bar')).toBe('bar');
  expect(mergeDescription(undefined, undefined)).toBe(undefined);
});

test.todo('insertDescriptionCommentStatementBeforeLine');
test.todo('updateDisableComment');
test.todo('insertDisableCommentStatementBeforeLine');

test('toInlineConfigCommentText', () => {
  expect(toInlineConfigCommentText({ rulesRecord: { a: 0, b: 1, c: 2 } })).toMatchInlineSnapshot(
    `"/* eslint a: 0, b: 1, c: 2 */"`,
  );
  expect(
    toInlineConfigCommentText({
      rulesRecord: { a: 'off', b: ['warn'], c: ['error', 'option1', 'option2'] },
    }),
  ).toMatchInlineSnapshot(`"/* eslint a: "off", b: ["warn"], c: ["error","option1","option2"] */"`);
  expect(
    toInlineConfigCommentText({
      rulesRecord: { 'plugin/a': 0, 'foo-bar/b': 0, '@baz/c': 0 },
    }),
  ).toMatchInlineSnapshot(`"/* eslint plugin/a: 0, foo-bar/b: 0, @baz/c: 0 */"`);
});

describe('filterResultsByRuleId', () => {
  test('returns the results with only messages with the specified rule ids', () => {
    expect(
      filterResultsByRuleId(
        [
          fakeLintResult({
            messages: [
              fakeLintMessage({ ruleId: 'a' }),
              fakeLintMessage({ ruleId: 'b' }),
              fakeLintMessage({ ruleId: 'c' }),
            ],
          }),
          fakeLintResult({
            messages: [
              fakeLintMessage({ ruleId: 'a' }),
              fakeLintMessage({ ruleId: 'b' }),
              fakeLintMessage({ ruleId: 'c' }),
            ],
          }),
        ],
        ['a', 'b'],
      ),
    ).toStrictEqual([
      fakeLintResult({
        messages: [fakeLintMessage({ ruleId: 'a' }), fakeLintMessage({ ruleId: 'b' })],
      }),
      fakeLintResult({
        messages: [fakeLintMessage({ ruleId: 'a' }), fakeLintMessage({ ruleId: 'b' })],
      }),
    ]);
  });
});

describe('findShebang', () => {
  test('find shebang from the first line of the file', () => {
    expect(findShebang('#!/bin/node\nval;')).toStrictEqual({
      range: [0, '#!/bin/node\n'.length],
    });
    expect(findShebang('#!/usr/bin/env node\nval;')).toStrictEqual({
      range: [0, '#!/usr/bin/env node\n'.length],
    });
  });
  test('returns null if the file does not have shebang', () => {
    expect(findShebang('val;')).toStrictEqual(null);
  });
  test('can find the shebang containing CRLF', () => {
    expect(findShebang('#!/bin/node\r\nval')).toStrictEqual({
      range: [0, '#!/bin/node\r\n'.length],
    });
  });
});
