import { FixTester } from '../../test-util/fix-tester.js';

const tester = new FixTester(
  'applyAutoFixes',
  {},
  { parserOptions: { ecmaVersion: 2020, ecmaFeatures: { jsx: true, globalReturn: true } } },
);

describe('apply-auto-fixes', () => {
  test('basic', async () => {
    expect(
      await tester.test({
        code: 'var val',
        ruleIdsToFix: ['semi'],
      }),
    ).toMatchInlineSnapshot(`"var val;"`);
  });
  test('同一行にて複数の rule を同時に fix できる', async () => {
    expect(
      await tester.test({
        code: 'var val',
        ruleIdsToFix: ['semi', 'no-var'],
      }),
    ).toMatchInlineSnapshot(`"let val;"`);
  });
  test('複数行を同時に fix できる', async () => {
    expect(
      await tester.test({
        code: ['var val1', 'var val2', '', 'var val3'],
        ruleIdsToFix: ['semi'],
      }),
    ).toMatchInlineSnapshot(`
      "var val1;
      var val2;

      var val3;"
    `);
  });
  test('fixable な problem がない場合は何もしない', async () => {
    expect(
      await tester.test({
        code: 'var val;',
        ruleIdsToFix: ['semi'],
      }),
    ).toMatchInlineSnapshot(`null`);
  });
});
