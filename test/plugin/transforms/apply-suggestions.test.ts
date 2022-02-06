import { basename } from 'path';
import { TransformTester } from '../../test-util/transform-tester.js';

const tester = new TransformTester(
  'applySuggestions',
  { filter: (suggestions) => suggestions[0] },
  { parserOptions: { ecmaVersion: 2020, ecmaFeatures: { jsx: true } } },
);

describe('apply-suggestions', () => {
  test('basic', async () => {
    expect(
      await tester.test({
        code: 'a = a + 1;',
        ruleIdsToTransform: ['eslint-interactive/prefer-addition-shorthand'],
        args: { filter: (suggestions) => suggestions[0] },
      }),
    ).toMatchInlineSnapshot(`"a += 1;"`);
  });
  test('一度に複数の suggestion を適用できる', async () => {
    expect(
      await tester.test({
        code: ['a = a + 1;', 'b = b + 1;'],
        ruleIdsToTransform: ['eslint-interactive/prefer-addition-shorthand'],
        args: { filter: (suggestions) => suggestions[0] },
      }),
    ).toMatchInlineSnapshot(`
      "a += 1;
      b += 1;"
    `);
  });
  test('一度に複数の rule の suggestion を適用できる', async () => {
    expect(
      await tester.test({
        code: ['a = a + 1;', 'if (!key in object) {}'],
        ruleIdsToTransform: ['eslint-interactive/prefer-addition-shorthand', 'no-unsafe-negation'],
        args: { filter: (suggestions) => suggestions[0] },
      }),
    ).toMatchInlineSnapshot(`
      "a += 1;
      if (!(key in object)) {}"
    `);
  });
  test('1 つの行に複数の suggestion があっても全ての suggestion が適用できる', async () => {
    expect(
      await tester.test({
        code: ['a = a + 1; b = b + 1;'],
        ruleIdsToTransform: ['eslint-interactive/prefer-addition-shorthand'],
        args: { filter: (suggestions) => suggestions[0] },
      }),
    ).toMatchInlineSnapshot(`"a += 1; b += 1;"`);
  });
  test('filter には suggestions, message が渡ってくる', async () => {
    await tester.test({
      code: ['a = a + 1;'],
      ruleIdsToTransform: ['eslint-interactive/prefer-addition-shorthand'],
      args: {
        filter: (suggestions, message, context) => {
          expect({
            suggestions,
            message,
            context: {
              ...context,
              // Use only basename, because the path will change depending on the environment.
              filename: basename(context.filename),
              // Take a snapshot of only part of it because `sourceCode` is huge
              sourceCode: { text: context.sourceCode.text },
            },
          }).toMatchSnapshot();
          return null;
        },
      },
    });
  });
  test('suggestion がない場合は何もしない', async () => {
    expect(
      await tester.test({
        code: 'a = a + 1;',
        ruleIdsToTransform: ['semi'],
        args: { filter: (suggestions) => suggestions[0] },
      }),
    ).toMatchInlineSnapshot(`null`);
  });
  test('filter から null もしくは undefined を返すと、suggestion は適用されない', async () => {
    expect(
      await tester.test({
        code: 'a = a + 1;',
        ruleIdsToTransform: ['eslint-interactive/prefer-addition-shorthand'],
        args: { filter: (_suggestions) => (Math.random() < 0.5 ? null : undefined) },
      }),
    ).toMatchInlineSnapshot(`null`);
  });
});
