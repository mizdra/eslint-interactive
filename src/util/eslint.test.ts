import { ESLint } from 'eslint';
import { fakeLintMessage, fakeLintResult } from '../test-util/eslint.js';
import {
  scanUsedPluginsFromResults,
  toCommentText,
  parseDisableComment,
  mergeRuleIdsAndDescription,
  findShebang,
  filterResultsByRuleId,
} from './eslint.js';

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
      expect(parseDisableComment({ type: 'Block', value: ' eslint-disable a', range })).toStrictEqual({
        type: 'Block',
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
    // file scope comment must be block-style.
    expect(parseDisableComment({ type: 'Line', value: ' eslint-disable a', range })).toStrictEqual(undefined);
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

describe('toCommentText', () => {
  test('Line 形式のコメントが作成できる', () => {
    expect(toCommentText({ type: 'Line', scope: 'next-line', ruleIds: ['a', 'b'] })).toMatchInlineSnapshot(
      `"// eslint-disable-next-line a, b"`,
    );
    expect(
      toCommentText({ type: 'Line', scope: 'next-line', ruleIds: ['a', 'b'], description: 'foo' }),
    ).toMatchInlineSnapshot(`"// eslint-disable-next-line a, b -- foo"`);
  });
  test('Block 形式のコメントが作成できる', () => {
    expect(toCommentText({ type: 'Block', scope: 'next-line', ruleIds: ['a', 'b'] })).toMatchInlineSnapshot(
      `"/* eslint-disable-next-line a, b */"`,
    );
    expect(
      toCommentText({ type: 'Block', scope: 'next-line', ruleIds: ['a', 'b'], description: 'foo' }),
    ).toMatchInlineSnapshot(`"/* eslint-disable-next-line a, b -- foo */"`);
  });
  test('file 全体に適用される disable コメントが作成できる', () => {
    expect(
      toCommentText({ type: 'Line', scope: 'file', ruleIds: ['a', 'b'], description: 'foo' }),
    ).toMatchInlineSnapshot(`"// eslint-disable a, b -- foo"`);
  });
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

describe('mergeRuleIdsAndDescription', () => {
  test('merges the ruleIds and description of the disable comments', () => {
    expect(
      mergeRuleIdsAndDescription(
        { ruleIds: ['a', 'b'], description: 'foo' },
        { ruleIds: ['b', 'c'], description: 'bar' },
      ),
    ).toStrictEqual({ ruleIds: ['a', 'b', 'c'], description: 'foo, bar' });
  });
  test('The description is optional', () => {
    expect(mergeRuleIdsAndDescription({ ruleIds: ['a', 'b'] }, { ruleIds: ['b', 'c'] })).toStrictEqual({
      ruleIds: ['a', 'b', 'c'],
    });
  });
  test('can merge the comment without description with the comment with description', () => {
    expect(
      mergeRuleIdsAndDescription({ ruleIds: ['a', 'b'], description: 'foo' }, { ruleIds: ['b', 'c'] }),
    ).toStrictEqual({
      ruleIds: ['a', 'b', 'c'],
      description: 'foo',
    });
    expect(
      mergeRuleIdsAndDescription({ ruleIds: ['a', 'b'] }, { ruleIds: ['b', 'c'], description: 'bar' }),
    ).toStrictEqual({
      ruleIds: ['a', 'b', 'c'],
      description: 'bar',
    });
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
