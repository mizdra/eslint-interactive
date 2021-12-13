import { Linter } from 'eslint';
import {
  createTransformToApplySuggestions,
  TransformToApplySuggestionsArgs,
} from '../../src/transforms/apply-suggestions.js';
import { TransformTester } from '../test-util/transform-tester.js';

const tester = new TransformTester<TransformToApplySuggestionsArgs>(
  createTransformToApplySuggestions,
  { filter: (suggestions) => suggestions[0] },
  { parserOptions: { ecmaVersion: 2020, ecmaFeatures: { jsx: true } } },
);

describe('apply-suggestions', () => {
  test('basic', () => {
    expect(
      tester.test({
        code: 'a = a + 1;',
        ruleIdsToTransform: ['prefer-addition-shorthand'],
        args: { filter: (suggestions) => suggestions[0] },
      }),
    ).toMatchInlineSnapshot(`"a += 1;"`);
  });
  test('一度に複数の suggestion を適用できる', () => {
    expect(
      tester.test({
        code: ['a = a + 1;', 'b = b + 1;'],
        ruleIdsToTransform: ['prefer-addition-shorthand'],
        args: { filter: (suggestions) => suggestions[0] },
      }),
    ).toMatchInlineSnapshot(`
      "a += 1;
      b += 1;"
    `);
  });
  test('一度に複数の rule の suggestion を適用できる', () => {
    expect(
      tester.test({
        code: ['a = a + 1;', 'if (!key in object) {}'],
        ruleIdsToTransform: ['prefer-addition-shorthand', 'no-unsafe-negation'],
        args: { filter: (suggestions) => suggestions[0] },
      }),
    ).toMatchInlineSnapshot(`
      "a += 1;
      if (!(key in object)) {}"
    `);
  });
  test('1 つの行に複数の suggestion があっても全ての suggestion が適用できる', () => {
    expect(
      tester.test({
        code: ['a = a + 1; b = b + 1;'],
        ruleIdsToTransform: ['prefer-addition-shorthand'],
        args: { filter: (suggestions) => suggestions[0] },
      }),
    ).toMatchInlineSnapshot(`"a += 1; b += 1;"`);
  });
  test('filter には suggestions, message が渡ってくる', () => {
    expect(
      tester.test({
        code: ['a = a + 1;'],
        ruleIdsToTransform: ['prefer-addition-shorthand'],
        args: {
          filter: (suggestions, message) => {
            const suggestion: Linter.LintSuggestion = {
              desc: 'description',
              fix: {
                range: [0, 9],
                text: "'" + JSON.stringify({ suggestions, message }, null, '  ') + "'",
              },
            };

            return suggestion;
          },
        },
      }),
    ).toMatchSnapshot();
  });
  test('suggestion がない場合は何もしない', () => {
    expect(
      tester.test({
        code: 'a = a + 1;',
        ruleIdsToTransform: ['semi'],
        args: { filter: (suggestions) => suggestions[0] },
      }),
    ).toMatchInlineSnapshot(`null`);
  });
  test('filter から null もしくは undefined を返すと、suggestion は適用されない', () => {
    expect(
      tester.test({
        code: 'a = a + 1;',
        ruleIdsToTransform: ['prefer-addition-shorthand'],
        args: { filter: (_suggestions) => (Math.random() < 0.5 ? null : undefined) },
      }),
    ).toMatchInlineSnapshot(`null`);
  });
});
