import type { FilterCriterion } from '../type.js';
import { unreachable } from '../util/type-check.js';
import type { RuleStatistic } from './take-rule-statistics.js';

function matchesCriterion(statistic: RuleStatistic, criterion: FilterCriterion): boolean {
  switch (criterion) {
    case 'fixable':
      return statistic.isFixableCount > 0;
    case 'has-suggestions':
      return statistic.hasSuggestionsCount > 0;
    default:
      return unreachable(`Invalid filter criterion: ${criterion as string}`);
  }
}

/**
 * Filter rule statistics by the given criteria.
 * Multiple criteria are OR-ed together; a statistic is kept if it matches any of them.
 * When `criteria` is undefined or empty, the input is returned unchanged.
 */
export function filterRuleStatistics(
  statistics: RuleStatistic[],
  criteria: readonly FilterCriterion[] | undefined,
): RuleStatistic[] {
  if (!criteria || criteria.length === 0) return statistics;
  return statistics.filter((statistic) => criteria.some((criterion) => matchesCriterion(statistic, criterion)));
}
