import { describe, expect, test } from 'vitest';
import { filterRuleStatistics } from './filter-rule-statistics.js';
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

describe('filterRuleStatistics', () => {
  const statistics: RuleStatistic[] = [
    fakeRuleStatistic({ ruleId: 'fixable-only', isFixableCount: 3, hasSuggestionsCount: 0 }),
    fakeRuleStatistic({ ruleId: 'suggestions-only', isFixableCount: 0, hasSuggestionsCount: 2 }),
    fakeRuleStatistic({ ruleId: 'both', isFixableCount: 1, hasSuggestionsCount: 1 }),
    fakeRuleStatistic({ ruleId: 'neither', isFixableCount: 0, hasSuggestionsCount: 0 }),
  ];

  test('returns the input unchanged when criteria is undefined', () => {
    expect(filterRuleStatistics(statistics, undefined)).toBe(statistics);
  });
  test('returns the input unchanged when criteria is empty', () => {
    expect(filterRuleStatistics(statistics, [])).toBe(statistics);
  });
  test('filters by "fixable"', () => {
    const result = filterRuleStatistics(statistics, ['fixable']);
    expect(result.map((s) => s.ruleId)).toEqual(['fixable-only', 'both']);
  });
  test('filters by "has-suggestions"', () => {
    const result = filterRuleStatistics(statistics, ['has-suggestions']);
    expect(result.map((s) => s.ruleId)).toEqual(['suggestions-only', 'both']);
  });
  test('combines multiple criteria with OR', () => {
    const result = filterRuleStatistics(statistics, ['fixable', 'has-suggestions']);
    expect(result.map((s) => s.ruleId)).toEqual(['fixable-only', 'suggestions-only', 'both']);
  });
  test('preserves input order', () => {
    const reversed = [...statistics].reverse();
    const result = filterRuleStatistics(reversed, ['fixable', 'has-suggestions']);
    expect(result.map((s) => s.ruleId)).toEqual(['both', 'suggestions-only', 'fixable-only']);
  });
});
