import { ESLint } from 'eslint';
import stripAnsi from 'strip-ansi';
import { formatByRules } from '../../src/formatter/format-by-rules';
import { fakeLintResult, fakeLintMessage, fakeFix } from '../util/eslint';

describe('formatByRules', () => {
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
    ];
    expect(stripAnsi(formatByRules(results))).toMatchInlineSnapshot(`
      "┌────────┬─────────────────┬───────────────────┐
      │ Rule   │ Error (fixable) │ Warning (fixable) │
      ├────────┼─────────────────┼───────────────────┤
      │ rule-a │ 4 (2)           │ 3 (1)             │
      ├────────┼─────────────────┼───────────────────┤
      │ rule-b │ 1 (0)           │ 0 (0)             │
      └────────┴─────────────────┴───────────────────┘"
    `);
  });
});
