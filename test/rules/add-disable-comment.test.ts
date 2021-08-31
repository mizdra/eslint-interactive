import { RuleTester } from 'eslint';
import rule, { Option } from '../../src/rules/add-disable-comment';

const ruleTester = new RuleTester({ parserOptions: { ecmaVersion: 2020, ecmaFeatures: { jsx: true } } });

const TARGET_FILENAME = 'file.js';
const OTHER_FILENAME = 'other.js';

function validCase(args: { code: string[]; option: Option }): RuleTester.ValidTestCase {
  return {
    code: args.code.join('\n'),
    filename: TARGET_FILENAME,
    options: [args.option],
  };
}

function invalidCase(args: { code: string[]; output: string[]; option: Option }): RuleTester.InvalidTestCase {
  return {
    code: args.code.join('\n'),
    output: args.output.join('\n'),
    errors: [{ message: 'add-disable-comment' }],
    filename: TARGET_FILENAME,
    options: [args.option],
  };
}

ruleTester.run('add-disable-comment', rule, {
  invalid: [
    // basic
    invalidCase({
      code: ['val;'],
      output: ['// eslint-disable-next-line a', 'val;'],
      option: { targets: [{ filename: TARGET_FILENAME, line: 1, ruleIds: ['a'] }] },
    }),
    // 同一行にて複数の rule を同時に disable できる
    invalidCase({
      code: ['val;'],
      output: ['// eslint-disable-next-line a, b', 'val;'],
      option: { targets: [{ filename: TARGET_FILENAME, line: 1, ruleIds: ['a', 'b'] }] },
    }),
    // 既に disable comment が付いている場合は、末尾に足す
    invalidCase({
      code: ['// eslint-disable-next-line semi', 'val;'],
      output: ['// eslint-disable-next-line semi, a', 'val;'],
      option: { targets: [{ filename: TARGET_FILENAME, line: 2, ruleIds: ['a'] }] },
    }),
    // 既に disable されている場合は何もしない
    invalidCase({
      code: ['// eslint-disable-next-line semi', 'val;'],
      output: ['// eslint-disable-next-line semi', 'val;'],
      option: { targets: [{ filename: TARGET_FILENAME, line: 2, ruleIds: ['semi'] }] },
    }),
    // `/* ... */` スタイルであっても disable できる
    invalidCase({
      code: ['/* eslint-disable-next-line semi */', 'val;'],
      output: ['/* eslint-disable-next-line semi, a */', 'val;'],
      option: { targets: [{ filename: TARGET_FILENAME, line: 2, ruleIds: ['a'] }] },
    }),
    // disable description があっても disable できる
    invalidCase({
      code: ['/* eslint-disable-next-line semi -- comment */', 'val;'],
      output: ['/* eslint-disable-next-line semi, a -- comment */', 'val;'],
      option: { targets: [{ filename: TARGET_FILENAME, line: 2, ruleIds: ['a'] }] },
    }),
    // disable description を追加できる
    invalidCase({
      code: ['/* eslint-disable-next-line semi */', 'val;'],
      output: ['/* eslint-disable-next-line semi, a -- comment */', 'val;'],
      option: { targets: [{ filename: TARGET_FILENAME, line: 2, ruleIds: ['a'] }], description: 'comment' },
    }),
    // 既に disable description があるコメントに対しても disable description を追加できる
    invalidCase({
      code: ['/* eslint-disable-next-line semi -- foo */', 'val;'],
      output: ['/* eslint-disable-next-line semi, a -- foo, bar */', 'val;'],
      option: { targets: [{ filename: TARGET_FILENAME, line: 2, ruleIds: ['a'] }], description: 'bar' },
    }),
    // 複数行を同時に disable できる
    invalidCase({
      code: ['val1;', 'val2;', '', 'val3;'],
      output: [
        '// eslint-disable-next-line a',
        'val1;',
        '// eslint-disable-next-line b',
        'val2;',
        '',
        '// eslint-disable-next-line c',
        'val3;',
      ],
      option: {
        targets: [
          { filename: TARGET_FILENAME, line: 1, ruleIds: ['a'] },
          { filename: TARGET_FILENAME, line: 2, ruleIds: ['b'] },
          { filename: TARGET_FILENAME, line: 4, ruleIds: ['c'] },
        ],
      },
    }),
    // JSX に対しても disable できる
    invalidCase({
      code: [
        'const jsx = <div>',
        '  <span>text1</span>',
        '  {/* eslint-disable-next-line semi */}',
        '  <span>text2</span>',
        '  {() => {',
        '    val;',
        '  }}',
        '</div>;',
      ],
      output: [
        '// eslint-disable-next-line a',
        'const jsx = <div>',
        '{/* eslint-disable-next-line b */}',
        '  <span>text1</span>',
        '  {/* eslint-disable-next-line semi, c */}',
        '  <span>text2</span>',
        '  {() => {',
        '// eslint-disable-next-line d',
        '    val;',
        '  }}',
        '</div>;',
      ],
      option: {
        targets: [
          { filename: TARGET_FILENAME, line: 1, ruleIds: ['a'] },
          { filename: TARGET_FILENAME, line: 2, ruleIds: ['b'] },
          { filename: TARGET_FILENAME, line: 4, ruleIds: ['c'] },
          { filename: TARGET_FILENAME, line: 6, ruleIds: ['d'] },
        ],
      },
    }),
    // disable comment のある行に disable comment 以外の Node があっても disable できる
    invalidCase({
      code: [
        'val1; // eslint-disable-next-line semi',
        'val2;',
        'val3; /* eslint-disable-next-line semi */ val4;',
        'val5;',
        '/* a */ /* eslint-disable-next-line semi */ /* b */',
        'val6;',
      ],
      output: [
        '// eslint-disable-next-line a',
        'val1; // eslint-disable-next-line semi, b',
        'val2;',
        '// eslint-disable-next-line c',
        'val3; /* eslint-disable-next-line semi, d */ val4;',
        'val5;',
        '/* a */ /* eslint-disable-next-line semi, e */ /* b */',
        'val6;',
      ],
      option: {
        targets: [
          { filename: TARGET_FILENAME, line: 1, ruleIds: ['a'] },
          { filename: TARGET_FILENAME, line: 2, ruleIds: ['b'] },
          { filename: TARGET_FILENAME, line: 3, ruleIds: ['c'] },
          { filename: TARGET_FILENAME, line: 4, ruleIds: ['d'] },
          { filename: TARGET_FILENAME, line: 6, ruleIds: ['e'] },
        ],
      },
    }),
    // `MAX_AUTOFIX_PASSES` より多い数の行を disable できる
    // ref: https://github.com/eslint/eslint/blob/81c60f4a8725738f191580646562d1dca7eee933/lib/linter/linter.js#L42
    invalidCase({
      code: [
        'val1;',
        'val2;',
        'val3;',
        'val4;',
        'val5;',
        'val6;',
        'val7;',
        'val8;',
        'val9;',
        'val10;',
        'val11;',
        'val12;',
      ],
      output: [
        '// eslint-disable-next-line a',
        'val1;',
        '// eslint-disable-next-line b',
        'val2;',
        '// eslint-disable-next-line c',
        'val3;',
        '// eslint-disable-next-line d',
        'val4;',
        '// eslint-disable-next-line e',
        'val5;',
        '// eslint-disable-next-line f',
        'val6;',
        '// eslint-disable-next-line g',
        'val7;',
        '// eslint-disable-next-line h',
        'val8;',
        '// eslint-disable-next-line i',
        'val9;',
        '// eslint-disable-next-line j',
        'val10;',
        '// eslint-disable-next-line k',
        'val11;',
        '// eslint-disable-next-line l',
        'val12;',
      ],
      option: {
        targets: [
          { filename: TARGET_FILENAME, line: 1, ruleIds: ['a'] },
          { filename: TARGET_FILENAME, line: 2, ruleIds: ['b'] },
          { filename: TARGET_FILENAME, line: 3, ruleIds: ['c'] },
          { filename: TARGET_FILENAME, line: 4, ruleIds: ['d'] },
          { filename: TARGET_FILENAME, line: 5, ruleIds: ['e'] },
          { filename: TARGET_FILENAME, line: 6, ruleIds: ['f'] },
          { filename: TARGET_FILENAME, line: 7, ruleIds: ['g'] },
          { filename: TARGET_FILENAME, line: 8, ruleIds: ['h'] },
          { filename: TARGET_FILENAME, line: 9, ruleIds: ['i'] },
          { filename: TARGET_FILENAME, line: 10, ruleIds: ['j'] },
          { filename: TARGET_FILENAME, line: 11, ruleIds: ['k'] },
          { filename: TARGET_FILENAME, line: 12, ruleIds: ['l'] },
        ],
      },
    }),
  ],
  valid: [
    // 他のファイル向けの disable は無視される
    validCase({
      code: ['val;'],
      option: { targets: [{ filename: OTHER_FILENAME, line: 1, ruleIds: ['a'] }] },
    }),
  ],
});
