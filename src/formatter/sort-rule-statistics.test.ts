import { describe, expect, test } from 'vitest';
import { sortRuleStatistics } from './sort-rule-statistics.js';
import type { RuleStatistic } from './take-rule-statistics.js';

function fakeRuleStatistic(partial: Partial<RuleStatistic> & { ruleId: string }): RuleStatistic {
  return {
    errorCount: 0,
    warningCount: 0,
    isFixableCount: 0,
    isFixableErrorCount: 0,
    isFixableWarningCount: 0,
    hasSuggestionsCount: 0,
    hasSuggestionsErrorCount: 0,
    hasSuggestionsWarningCount: 0,
    ...partial,
  };
}

describe('sortRuleStatistics', () => {
  const statistics: RuleStatistic[] = [
    fakeRuleStatistic({ ruleId: 'b-rule', errorCount: 3, warningCount: 1, isFixableCount: 0, hasSuggestionsCount: 2 }),
    fakeRuleStatistic({ ruleId: 'a-rule', errorCount: 1, warningCount: 5, isFixableCount: 3, hasSuggestionsCount: 0 }),
    fakeRuleStatistic({ ruleId: 'c-rule', errorCount: 5, warningCount: 0, isFixableCount: 1, hasSuggestionsCount: 1 }),
  ];
  test('sorts by rule name ascending by default', () => {
    const result = sortRuleStatistics(statistics, 'rule');
    expect(result.map((s) => s.ruleId)).toEqual(['a-rule', 'b-rule', 'c-rule']);
  });
  test('sorts by rule name descending', () => {
    const result = sortRuleStatistics(statistics, 'rule', 'desc');
    expect(result.map((s) => s.ruleId)).toEqual(['c-rule', 'b-rule', 'a-rule']);
  });
  test('sorts by error count descending by default', () => {
    const result = sortRuleStatistics(statistics, 'error');
    expect(result.map((s) => s.ruleId)).toEqual(['c-rule', 'b-rule', 'a-rule']);
  });
  test('sorts by error count ascending', () => {
    const result = sortRuleStatistics(statistics, 'error', 'asc');
    expect(result.map((s) => s.ruleId)).toEqual(['a-rule', 'b-rule', 'c-rule']);
  });
  test('sorts by warning count descending by default', () => {
    const result = sortRuleStatistics(statistics, 'warning');
    expect(result.map((s) => s.ruleId)).toEqual(['a-rule', 'b-rule', 'c-rule']);
  });
  test('sorts by fixable count descending by default', () => {
    const result = sortRuleStatistics(statistics, 'fixable');
    expect(result.map((s) => s.ruleId)).toEqual(['a-rule', 'c-rule', 'b-rule']);
  });
  test('sorts by suggestions count descending by default', () => {
    const result = sortRuleStatistics(statistics, 'suggestions');
    expect(result.map((s) => s.ruleId)).toEqual(['b-rule', 'c-rule', 'a-rule']);
  });
});
