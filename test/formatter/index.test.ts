import { ESLint } from 'eslint';
import stripAnsi from 'strip-ansi';
import { format } from '../../src/formatter';
import { fakeLintResult, fakeLintMessage, fakeFix } from '../util/eslint';

describe('format', () => {
  test('outputs formatted text', () => {
    const results: ESLint.LintResult[] = [
      fakeLintResult({
        messages: [
          fakeLintMessage({ ruleId: 'rule-a', severity: 2 }),
          fakeLintMessage({ ruleId: 'rule-a', severity: 2 }),
          fakeLintMessage({ ruleId: 'rule-a', severity: 2, fix: fakeFix() }),
          fakeLintMessage({ ruleId: 'rule-a', severity: 2, fix: fakeFix() }),
          fakeLintMessage({ ruleId: 'rule-a', severity: 1 }),
          fakeLintMessage({ ruleId: 'rule-a', severity: 1 }),
          fakeLintMessage({ ruleId: 'rule-a', severity: 1, fix: fakeFix() }),
          fakeLintMessage({ ruleId: 'rule-b', severity: 2 }),
        ],
      }),
      fakeLintResult({
        messages: [],
      }),
    ];
    expect(stripAnsi(format(results))).toMatchInlineSnapshot(`
      "2 file(s) checked.  1 passed.  1 failed.
      ┌────────┬─────────────────┬───────────────────┐
      │ Rule   │ Error (fixable) │ Warning (fixable) │
      ├────────┼─────────────────┼───────────────────┤
      │ rule-a │ 4 (2)           │ 3 (1)             │
      ├────────┼─────────────────┼───────────────────┤
      │ rule-b │ 1 (0)           │ 0 (0)             │
      └────────┴─────────────────┴───────────────────┘"
    `);
  });
});
