import { ESLint } from 'eslint';
import { takeRuleStatistics, type RuleStatistic } from '../../src/formatter/take-rule-statistics.js';
import { fakeLintResult, fakeLintMessage, fakeFix, fakeSuggestions } from '../test-util/eslint.js';

describe('takeRuleStatistics', () => {
  test('aggregates errors and warnings for each rule', () => {
    const results: ESLint.LintResult[] = [
      fakeLintResult({
        messages: [
          fakeLintMessage({ ruleId: 'rule-a', severity: 2 }),
          fakeLintMessage({ ruleId: 'rule-a', severity: 2 }),
          fakeLintMessage({ ruleId: 'rule-b', severity: 2 }),
        ],
      }),
    ];
    expect(takeRuleStatistics(results)).toEqual<RuleStatistic[]>([
      {
        ruleId: 'rule-a',
        errorCount: 2,
        warningCount: 0,
        isFixableCount: 0,
        isFixableErrorCount: 0,
        isFixableWarningCount: 0,
        hasSuggestionsCount: 0,
        hasSuggestionsErrorCount: 0,
        hasSuggestionsWarningCount: 0,
      },
      {
        ruleId: 'rule-b',
        errorCount: 1,
        warningCount: 0,
        isFixableCount: 0,
        isFixableErrorCount: 0,
        isFixableWarningCount: 0,
        hasSuggestionsCount: 0,
        hasSuggestionsErrorCount: 0,
        hasSuggestionsWarningCount: 0,
      },
    ]);
  });
  test('calculates the cumulative total of errors and warnings from all `LintResult`', () => {
    const results: ESLint.LintResult[] = [
      fakeLintResult({
        messages: [
          fakeLintMessage({ ruleId: 'rule-a', severity: 2 }),
          fakeLintMessage({ ruleId: 'rule-a', severity: 2 }),
        ],
      }),
      fakeLintResult({
        messages: [fakeLintMessage({ ruleId: 'rule-a', severity: 2 })],
      }),
    ];
    expect(takeRuleStatistics(results)).toEqual([
      {
        ruleId: 'rule-a',
        errorCount: 3,
        warningCount: 0,
        isFixableCount: 0,
        isFixableErrorCount: 0,
        isFixableWarningCount: 0,
        hasSuggestionsCount: 0,
        hasSuggestionsErrorCount: 0,
        hasSuggestionsWarningCount: 0,
      },
    ]);
  });
  test('calculates the cumulative total of errors and warnings or isFixable ones separately', () => {
    const results: ESLint.LintResult[] = [
      fakeLintResult({
        messages: [
          fakeLintMessage({ ruleId: 'rule-a', severity: 2 }),
          fakeLintMessage({ ruleId: 'rule-a', severity: 2 }),
          fakeLintMessage({ ruleId: 'rule-a', severity: 2 }),
          fakeLintMessage({ ruleId: 'rule-a', severity: 2 }),
          fakeLintMessage({ ruleId: 'rule-a', severity: 1 }),
          fakeLintMessage({ ruleId: 'rule-a', severity: 1 }),
        ],
      }),
      fakeLintResult({
        messages: [
          fakeLintMessage({ ruleId: 'rule-a', severity: 2, fix: fakeFix() }),
          fakeLintMessage({ ruleId: 'rule-a', severity: 2, fix: fakeFix() }),
          fakeLintMessage({ ruleId: 'rule-a', severity: 1, fix: fakeFix() }),
        ],
      }),
    ];
    expect(takeRuleStatistics(results)).toEqual([
      {
        ruleId: 'rule-a',
        errorCount: 6,
        warningCount: 3,
        isFixableCount: 3,
        isFixableErrorCount: 2,
        isFixableWarningCount: 1,
        hasSuggestionsCount: 0,
        hasSuggestionsErrorCount: 0,
        hasSuggestionsWarningCount: 0,
      },
    ]);
  });
  test('calculates the cumulative total of errors and warnings or suggest-applicable ones separately', () => {
    const results: ESLint.LintResult[] = [
      fakeLintResult({
        messages: [
          fakeLintMessage({ ruleId: 'rule-a', severity: 2 }),
          fakeLintMessage({ ruleId: 'rule-a', severity: 2 }),
          fakeLintMessage({ ruleId: 'rule-a', severity: 2 }),
          fakeLintMessage({ ruleId: 'rule-a', severity: 2 }),
          fakeLintMessage({ ruleId: 'rule-a', severity: 1 }),
          fakeLintMessage({ ruleId: 'rule-a', severity: 1 }),
        ],
      }),
      fakeLintResult({
        messages: [
          fakeLintMessage({ ruleId: 'rule-a', severity: 2, suggestions: fakeSuggestions() }),
          fakeLintMessage({ ruleId: 'rule-a', severity: 2, suggestions: fakeSuggestions() }),
          fakeLintMessage({ ruleId: 'rule-a', severity: 1, suggestions: fakeSuggestions() }),
        ],
      }),
    ];
    expect(takeRuleStatistics(results)).toEqual([
      {
        ruleId: 'rule-a',
        errorCount: 6,
        warningCount: 3,
        isFixableCount: 0,
        isFixableErrorCount: 0,
        isFixableWarningCount: 0,
        hasSuggestionsCount: 3,
        hasSuggestionsErrorCount: 2,
        hasSuggestionsWarningCount: 1,
      },
    ]);
  });
  test('ignore errors and warnings that are without a `ruleId`', () => {
    const results: ESLint.LintResult[] = [
      fakeLintResult({
        messages: [fakeLintMessage({ ruleId: null, severity: 2 })],
      }),
    ];
    expect(takeRuleStatistics(results)).toEqual([]);
  });
});
