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
    const formattedText = formatByRules(results);
    expect(stripAnsi(formattedText)).toMatchInlineSnapshot(`
      "┌────────┬─────────────────┬───────────────────┐
      │ Rule   │ Error (fixable) │ Warning (fixable) │
      ├────────┼─────────────────┼───────────────────┤
      │ rule-a │ 4 (2)           │ 3 (1)             │
      ├────────┼─────────────────┼───────────────────┤
      │ rule-b │ 1 (0)           │ 0 (0)             │
      └────────┴─────────────────┴───────────────────┘"
    `);
    expect(formattedText).toMatchInlineSnapshot(`
      "[37m┌────────┬─────────────────┬───────────────────┐[39m
      [37m│[39m[31m Rule   [39m[37m│[39m[31m Error (fixable) [39m[37m│[39m[31m Warning (fixable) [39m[37m│[39m
      [37m├────────┼─────────────────┼───────────────────┤[39m
      [37m│[39m rule-a [37m│[39m [31m[1m4 (2)[22m[39m           [37m│[39m [33m[1m3 (1)[22m[39m             [37m│[39m
      [37m├────────┼─────────────────┼───────────────────┤[39m
      [37m│[39m rule-b [37m│[39m [31m[1m1 (0)[22m[39m           [37m│[39m 0 (0)             [37m│[39m
      [37m└────────┴─────────────────┴───────────────────┘[39m"
    `);
  });
});
