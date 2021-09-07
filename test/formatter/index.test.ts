import { ESLint } from 'eslint';
import stripAnsi from 'strip-ansi';
import { format } from '../../src/formatter';
import { fakeLintResult, fakeLintMessage, fakeFix, fakeSuggestions } from '../test-util/eslint';

describe('format', () => {
  test('outputs formatted text', () => {
    const results: ESLint.LintResult[] = [
      fakeLintResult({
        messages: [
          fakeLintMessage({ ruleId: 'rule-a', severity: 2 }),
          fakeLintMessage({ ruleId: 'rule-a', severity: 2 }),
          fakeLintMessage({ ruleId: 'rule-a', severity: 2, fix: fakeFix() }),
          fakeLintMessage({ ruleId: 'rule-a', severity: 2, fix: fakeFix() }),
          fakeLintMessage({ ruleId: 'rule-a', severity: 2, suggestions: fakeSuggestions() }),
          fakeLintMessage({ ruleId: 'rule-a', severity: 2, suggestions: fakeSuggestions() }),
          fakeLintMessage({ ruleId: 'rule-a', severity: 2, suggestions: fakeSuggestions() }),
          fakeLintMessage({ ruleId: 'rule-a', severity: 2, suggestions: fakeSuggestions() }),
          fakeLintMessage({ ruleId: 'rule-a', severity: 1 }),
          fakeLintMessage({ ruleId: 'rule-a', severity: 1 }),
          fakeLintMessage({ ruleId: 'rule-a', severity: 1, fix: fakeFix() }),
          fakeLintMessage({ ruleId: 'rule-a', severity: 1, suggestions: fakeSuggestions() }),
          fakeLintMessage({ ruleId: 'rule-a', severity: 1, suggestions: fakeSuggestions() }),
          fakeLintMessage({ ruleId: 'rule-b', severity: 2 }),
        ],
      }),
      fakeLintResult({
        messages: [],
      }),
    ];
    const formattedText = format(results);
    expect(stripAnsi(formattedText)).toMatchInlineSnapshot(`
"- 2 files (1 file passed, 1 file failed) checked.

┌────────┬────────────────────────────────────┬──────────────────────────────────────┐
│ Rule   │ Error (fixable/suggest-applicable) │ Warning (fixable/suggest-applicable) │
├────────┼────────────────────────────────────┼──────────────────────────────────────┤
│ rule-a │ 8 (2/4)                            │ 5 (1/2)                              │
├────────┼────────────────────────────────────┼──────────────────────────────────────┤
│ rule-b │ 1 (0/0)                            │ 0 (0/0)                              │
└────────┴────────────────────────────────────┴──────────────────────────────────────┘"
`);
    expect(formattedText).toMatchInlineSnapshot(`
"[1m- 2 files (1 file passed, [91m1 file failed[39m) checked.[22m
[1m[22m
[37m┌────────┬────────────────────────────────────┬──────────────────────────────────────┐[39m
[37m│[39m[31m Rule   [39m[37m│[39m[31m Error (fixable/suggest-applicable) [39m[37m│[39m[31m Warning (fixable/suggest-applicable) [39m[37m│[39m
[37m├────────┼────────────────────────────────────┼──────────────────────────────────────┤[39m
[37m│[39m rule-a [37m│[39m [31m[1m8 (2/4)[22m[39m                            [37m│[39m [33m[1m5 (1/2)[22m[39m                              [37m│[39m
[37m├────────┼────────────────────────────────────┼──────────────────────────────────────┤[39m
[37m│[39m rule-b [37m│[39m [31m[1m1 (0/0)[22m[39m                            [37m│[39m 0 (0/0)                              [37m│[39m
[37m└────────┴────────────────────────────────────┴──────────────────────────────────────┘[39m"
`);
  });
});
