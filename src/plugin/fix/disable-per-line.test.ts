import { FixTester } from '../../test-util/fix-tester.js';

const tester = new FixTester(
  'disablePerLine',
  {},
  { parserOptions: { ecmaVersion: 2020, ecmaFeatures: { jsx: true } } },
);

describe('disable-per-line', () => {
  test('basic', async () => {
    expect(
      await tester.test({
        code: 'var val',
        ruleIdsToFix: ['semi'],
      }),
    ).toMatchInlineSnapshot(`
      "// eslint-disable-next-line semi
      var val"
    `);
  });
  test('同一行にて複数の rule を同時に disable できる', async () => {
    expect(
      await tester.test({
        code: 'var val',
        ruleIdsToFix: ['semi', 'no-var'],
      }),
    ).toMatchInlineSnapshot(`
      "// eslint-disable-next-line no-var, semi
      var val"
    `);
  });
  test('既に disable comment が付いている場合は、末尾に足す', async () => {
    expect(
      await tester.test({
        code: ['// eslint-disable-next-line semi', 'var val'],
        ruleIdsToFix: ['no-var'],
      }),
    ).toMatchInlineSnapshot(`
      "/* eslint-disable-next-line semi, no-var */
      var val"
    `);
  });
  test('既に disable されている場合は何もしない', async () => {
    expect(
      await tester.test({
        code: ['// eslint-disable-next-line semi', 'var val'],
        ruleIdsToFix: ['semi'],
      }),
    ).toMatchInlineSnapshot(`null`);
  });
  test('`/* ... */` スタイルであっても disable できる', async () => {
    expect(
      await tester.test({
        code: ['/* eslint-disable-next-line semi */', 'var val'],
        ruleIdsToFix: ['no-var'],
      }),
    ).toMatchInlineSnapshot(`
      "/* eslint-disable-next-line semi, no-var */
      var val"
    `);
  });
  test('disable description があっても disable できる', async () => {
    expect(
      await tester.test({
        code: ['// eslint-disable-next-line semi -- comment', 'var val'],
        ruleIdsToFix: ['no-var'],
      }),
    ).toMatchInlineSnapshot(`
      "/* eslint-disable-next-line semi, no-var -- comment */
      var val"
    `);
  });
  test('disable description を追加できる', async () => {
    expect(
      await tester.test({
        code: ['// eslint-disable-next-line semi', 'var val'],
        ruleIdsToFix: ['no-var'],
        args: { description: 'comment' },
      }),
    ).toMatchInlineSnapshot(`
      "/* eslint-disable-next-line semi, no-var -- comment */
      var val"
    `);
  });
  test('既に disable description があるコメントに対しても disable description を追加できる', async () => {
    expect(
      await tester.test({
        code: ['// eslint-disable-next-line semi -- foo', 'var val'],
        ruleIdsToFix: ['no-var'],
        args: { description: 'bar' },
      }),
    ).toMatchInlineSnapshot(`
      "/* eslint-disable-next-line semi, no-var -- foo, bar */
      var val"
    `);
  });
  test('複数行を同時に disable できる', async () => {
    expect(
      await tester.test({
        code: ['var val1', 'var val2', '', 'var val3'],
        ruleIdsToFix: ['no-var'],
      }),
    ).toMatchInlineSnapshot(`
      "// eslint-disable-next-line no-var
      var val1
      // eslint-disable-next-line no-var
      var val2

      // eslint-disable-next-line no-var
      var val3"
    `);
  });
  test('JSX に対しても disable できる', async () => {
    expect(
      await tester.test({
        code: [
          'var jsx = <div>',
          '  <span>text1</span>',
          '  <span>{void 2}</span>',
          '  {/* eslint-disable-next-line semi */}',
          '  <span>{void 3}</span>',
          '  {() => {',
          '    var val;',
          '  }}',
          '</div>;',
        ],

        ruleIdsToFix: ['no-var', 'no-void'],
      }),
    ).toMatchInlineSnapshot(`
      "// eslint-disable-next-line no-var
      var jsx = <div>
        <span>text1</span>
        {/* eslint-disable-next-line no-void */}
        <span>{void 2}</span>
        {/* eslint-disable-next-line semi, no-void */}
        <span>{void 3}</span>
        {() => {
          // eslint-disable-next-line no-var
          var val;
        }}
      </div>;"
    `);
  });
  test('disable comment のある行に disable comment 以外の Node があっても disable できる', async () => {
    expect(
      await tester.test({
        code: [
          'var val1; // eslint-disable-next-line semi',
          'var val2;',
          'var val3; /* eslint-disable-next-line semi */ val4;',
          'var val5;',
          '/* a */ /* eslint-disable-next-line semi */ /* b */',
          'var val6;',
        ],

        ruleIdsToFix: ['no-var'],
      }),
    ).toMatchInlineSnapshot(`
      "// eslint-disable-next-line no-var
      var val1; /* eslint-disable-next-line semi, no-var */
      var val2;
      // eslint-disable-next-line no-var
      var val3; /* eslint-disable-next-line semi, no-var */ val4;
      var val5;
      /* a */ /* eslint-disable-next-line semi, no-var */ /* b */
      var val6;"
    `);
  });
});
