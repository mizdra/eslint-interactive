import { ESLint } from 'eslint';
import stripAnsi from 'strip-ansi';
import { formatByRules } from '../../src/formatter/format-by-rules.js';
import { fakeLintResult, fakeLintMessage, fakeFix, fakeSuggestions } from '../test-util/eslint.js';

describe('formatByRules', () => {
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
    ];
    const formattedText = formatByRules(results);
    expect(stripAnsi(formattedText)).toMatchInlineSnapshot(`
"┌────────┬────────────────────────────────────┬──────────────────────────────────────┐
│ Rule   │ Error (fixable/suggest-applicable) │ Warning (fixable/suggest-applicable) │
├────────┼────────────────────────────────────┼──────────────────────────────────────┤
│ rule-a │ 8 (2/4)                            │ 5 (1/2)                              │
├────────┼────────────────────────────────────┼──────────────────────────────────────┤
│ rule-b │ 1 (0/0)                            │ 0 (0/0)                              │
└────────┴────────────────────────────────────┴──────────────────────────────────────┘"
`);
    expect(formattedText).toMatchInlineSnapshot(`
"┌────────┬────────────────────────────────────┬──────────────────────────────────────┐
│ Rule   │ Error (fixable/suggest-applicable) │ Warning (fixable/suggest-applicable) │
├────────┼────────────────────────────────────┼──────────────────────────────────────┤
│ rule-a │ [31m[1m8 (2/4)[22m[39m                            │ [33m[1m5 (1/2)[22m[39m                              │
├────────┼────────────────────────────────────┼──────────────────────────────────────┤
│ rule-b │ [31m[1m1 (0/0)[22m[39m                            │ 0 (0/0)                              │
└────────┴────────────────────────────────────┴──────────────────────────────────────┘"
`);
  });
  test('prints link', () => {
    const results: ESLint.LintResult[] = [
      fakeLintResult({
        messages: [
          fakeLintMessage({ ruleId: 'rule-a', severity: 2 }), // link is printed
          fakeLintMessage({ ruleId: 'rule-b', severity: 2 }), // no link is printed
          fakeLintMessage({ ruleId: 'plugin/rule-c', severity: 2 }), // link is printed
        ],
      }),
    ];
    const formattedText = formatByRules(results, {
      rulesMeta: {
        'rule-a': { docs: { url: 'https://example.com/rule-a' } },
        'plugin/rule-c': { docs: { url: 'https://example.com/plugin/rule-c' } },
      },
    });
    expect(stripAnsi(formattedText)).toMatchInlineSnapshot(`
"┌─────────────────────────────────────────────────────┬────────────────────────────────────┬──────────────────────────────────────┐
│ Rule                                                │ Error (fixable/suggest-applicable) │ Warning (fixable/suggest-applicable) │
├─────────────────────────────────────────────────────┼────────────────────────────────────┼──────────────────────────────────────┤
│ rule-a (​https://example.com/rule-a​)               │ 1 (0/0)                            │ 0 (0/0)                              │
├─────────────────────────────────────────────────────┼────────────────────────────────────┼──────────────────────────────────────┤
│ rule-b                                              │ 1 (0/0)                            │ 0 (0/0)                              │
├─────────────────────────────────────────────────────┼────────────────────────────────────┼──────────────────────────────────────┤
│ plugin/rule-c (​https://example.com/plugin/rule-c​) │ 1 (0/0)                            │ 0 (0/0)                              │
└─────────────────────────────────────────────────────┴────────────────────────────────────┴──────────────────────────────────────┘"
`);
    expect(formattedText).toMatchInlineSnapshot(`
"┌─────────────────────────────────────────────────────┬────────────────────────────────────┬──────────────────────────────────────┐
│ Rule                                                │ Error (fixable/suggest-applicable) │ Warning (fixable/suggest-applicable) │
├─────────────────────────────────────────────────────┼────────────────────────────────────┼──────────────────────────────────────┤
│ rule-a (​https://example.com/rule-a​)               │ [31m[1m1 (0/0)[22m[39m                            │ 0 (0/0)                              │
├─────────────────────────────────────────────────────┼────────────────────────────────────┼──────────────────────────────────────┤
│ rule-b                                              │ [31m[1m1 (0/0)[22m[39m                            │ 0 (0/0)                              │
├─────────────────────────────────────────────────────┼────────────────────────────────────┼──────────────────────────────────────┤
│ plugin/rule-c (​https://example.com/plugin/rule-c​) │ [31m[1m1 (0/0)[22m[39m                            │ 0 (0/0)                              │
└─────────────────────────────────────────────────────┴────────────────────────────────────┴──────────────────────────────────────┘"
`);
  });
});
