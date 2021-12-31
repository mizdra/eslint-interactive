import { createTransformToDisablePerLine } from '../../src/plugin/transforms/disable-per-line.js';
import { TransformTester } from '../test-util/transform-tester.js';

const tester = new TransformTester(
  createTransformToDisablePerLine,
  {},
  { parserOptions: { ecmaVersion: 2020, ecmaFeatures: { jsx: true } } },
);

describe('disable-per-line', () => {
  test('basic', () => {
    expect(
      tester.test({
        code: 'var val',
        ruleIdsToTransform: ['semi'],
      }),
    ).toMatchInlineSnapshot(`
      "// eslint-disable-next-line semi
      var val"
    `);
  });
  test('同一行にて複数の rule を同時に disable できる', () => {
    expect(
      tester.test({
        code: 'var val',
        ruleIdsToTransform: ['semi', 'no-var'],
      }),
    ).toMatchInlineSnapshot(`
      "// eslint-disable-next-line no-var, semi
      var val"
    `);
  });
  test('既に disable comment が付いている場合は、末尾に足す', () => {
    expect(
      tester.test({
        code: ['// eslint-disable-next-line semi', 'var val'],
        ruleIdsToTransform: ['no-var'],
      }),
    ).toMatchInlineSnapshot(`
      "/* eslint-disable-next-line semi, no-var */
      var val"
    `);
  });
  test('既に disable されている場合は何もしない', () => {
    expect(
      tester.test({
        code: ['// eslint-disable-next-line semi', 'var val'],
        ruleIdsToTransform: ['semi'],
      }),
    ).toMatchInlineSnapshot(`null`);
  });
  test('`/* ... */` スタイルであっても disable できる', () => {
    expect(
      tester.test({
        code: ['/* eslint-disable-next-line semi */', 'var val'],
        ruleIdsToTransform: ['no-var'],
      }),
    ).toMatchInlineSnapshot(`
      "/* eslint-disable-next-line semi, no-var */
      var val"
    `);
  });
  test('disable description があっても disable できる', () => {
    expect(
      tester.test({
        code: ['// eslint-disable-next-line semi -- comment', 'var val'],
        ruleIdsToTransform: ['no-var'],
      }),
    ).toMatchInlineSnapshot(`
      "/* eslint-disable-next-line semi, no-var -- comment */
      var val"
    `);
  });
  test('disable description を追加できる', () => {
    expect(
      tester.test({
        code: ['// eslint-disable-next-line semi', 'var val'],
        ruleIdsToTransform: ['no-var'],
        args: { description: 'comment' },
      }),
    ).toMatchInlineSnapshot(`
      "/* eslint-disable-next-line semi, no-var -- comment */
      var val"
    `);
  });
  test('既に disable description があるコメントに対しても disable description を追加できる', () => {
    expect(
      tester.test({
        code: ['// eslint-disable-next-line semi -- foo', 'var val'],
        ruleIdsToTransform: ['no-var'],
        args: { description: 'bar' },
      }),
    ).toMatchInlineSnapshot(`
      "/* eslint-disable-next-line semi, no-var -- foo, bar */
      var val"
    `);
  });
  test('複数行を同時に disable できる', () => {
    expect(
      tester.test({
        code: ['var val1', 'var val2', '', 'var val3'],
        ruleIdsToTransform: ['no-var'],
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
  test('JSX に対しても disable できる', () => {
    expect(
      tester.test({
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

        ruleIdsToTransform: ['no-var', 'no-void'],
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
  test('disable comment のある行に disable comment 以外の Node があっても disable できる', () => {
    expect(
      tester.test({
        code: [
          'var val1; // eslint-disable-next-line semi',
          'var val2;',
          'var val3; /* eslint-disable-next-line semi */ val4;',
          'var val5;',
          '/* a */ /* eslint-disable-next-line semi */ /* b */',
          'var val6;',
        ],

        ruleIdsToTransform: ['no-var'],
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
