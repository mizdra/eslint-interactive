import type { SortField, SortOrder } from '../type.js';
import { unreachable } from '../util/type-check.js';
import type { RuleStatistic } from './take-rule-statistics.js';

const SORT_FIELD_TO_KEY: Record<SortField, keyof RuleStatistic> = {
  rule: 'ruleId',
  error: 'errorCount',
  warning: 'warningCount',
  fixable: 'isFixableCount',
  suggestions: 'hasSuggestionsCount',
};

/** Get the default sort order for a given field */
function getDefaultSortOrder(field: SortField): SortOrder {
  return field === 'rule' ? 'asc' : 'desc';
}

/** Sort rule statistics by the specified field and order */
export function sortRuleStatistics(statistics: RuleStatistic[], field: SortField, order?: SortOrder): RuleStatistic[] {
  const resolvedOrder = order ?? getDefaultSortOrder(field);
  const key = SORT_FIELD_TO_KEY[field];
  const sorted = [...statistics].sort((a, b) => {
    const aVal = a[key];
    const bVal = b[key];
    if (typeof aVal === 'string' && typeof bVal === 'string') {
      return aVal.localeCompare(bVal);
    } else if (typeof aVal === 'number' && typeof bVal === 'number') {
      return aVal - bVal;
    } else {
      return unreachable('Invalid sort key type');
    }
  });
  if (resolvedOrder === 'desc') sorted.reverse();
  return sorted;
}
