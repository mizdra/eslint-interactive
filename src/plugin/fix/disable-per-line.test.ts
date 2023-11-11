/* eslint-disable no-irregular-whitespace */
import { describe, expect, test } from "vitest";

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
      "// eslint-disable-next-line semi, no-var
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
      "// eslint-disable-next-line semi, no-var -- comment
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
      "// eslint-disable-next-line semi, no-var -- comment
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
      "// eslint-disable-next-line semi, no-var -- foo, bar
      var val"
    `);
  });
  test('add a description to the line before the disable comment if there is already disable comment', async () => {
    expect(
      await tester.test({
        code: ['// eslint-disable-next-line semi -- foo', 'var val'],
        ruleIdsToFix: ['no-var'],
        args: { description: 'bar', descriptionPosition: 'previousLine' },
      }),
    ).toMatchInlineSnapshot(`
      "// bar
      // eslint-disable-next-line semi, no-var -- foo
      var val"
    `);
  });
  test('add a description comment before the line with the problem', async () => {
    expect(
      await tester.test({
        code: ['var val'],
        ruleIdsToFix: ['semi'],
        args: { description: 'foo', descriptionPosition: 'previousLine' },
      }),
    ).toMatchInlineSnapshot(`
      "// foo
      // eslint-disable-next-line semi
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
  describe('add a disable comment for JSX', () => {
    test('when descriptionPosition is sameLine', async () => {
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
          args: { description: 'foo', descriptionPosition: 'sameLine' },
        }),
      ).toMatchInlineSnapshot(`
        "// eslint-disable-next-line no-var -- foo
        var jsx = <div>
          <span>text1</span>
          {/* eslint-disable-next-line no-void -- foo */}
          <span>{void 2}</span>
          {/* eslint-disable-next-line semi, no-void -- foo */}
          <span>{void 3}</span>
          {() => {
            // eslint-disable-next-line no-var -- foo
            var val;
          }}
        </div>;"
      `);
    });
    test('when descriptionPosition is previousLine', async () => {
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
          args: { description: 'foo', descriptionPosition: 'previousLine' },
        }),
      ).toMatchInlineSnapshot(`
        "// foo
        // eslint-disable-next-line no-var
        var jsx = <div>
          <span>text1</span>
          {/* foo */}
          {/* eslint-disable-next-line no-void */}
          <span>{void 2}</span>
          {/* foo */}
          {/* eslint-disable-next-line semi, no-void */}
          <span>{void 3}</span>
          {() => {
            // foo
            // eslint-disable-next-line no-var
            var val;
          }}
        </div>;"
      `);
    });
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
      var val1; // eslint-disable-next-line semi, no-var
      var val2;
      // eslint-disable-next-line no-var
      var val3; /* eslint-disable-next-line semi, no-var */ val4;
      var val5;
      /* a */ /* eslint-disable-next-line semi, no-var */ /* b */
      var val6;"
    `);
  });
  test('supports auto-indent', async () => {
    expect(
      await tester.test({
        code: [
          '{',
          '  void 0;',
          '};',
          '{',
          '\u{0009}\u{000B}\u{000C}\u{FEFF}\u{0020}\u{00A0}void 0;',
          '};',
          '<div>',
          '  {void 0}',
          '</div>',
        ],

        ruleIdsToFix: ['no-void'],
      }),
    ).toMatchInlineSnapshot(`
      "{
        // eslint-disable-next-line no-void
        void 0;
      };
      {
      	﻿  // eslint-disable-next-line no-void
      	﻿  void 0;
      };
      <div>
        {/* eslint-disable-next-line no-void */}
        {void 0}
      </div>"
    `);
  });
});
