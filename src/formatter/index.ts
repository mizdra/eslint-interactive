import type { ESLint } from 'eslint';
import { formatByFiles } from './format-by-files.js';
import { formatByRules, type FormatByRulesOptions } from './format-by-rules.js';

export { takeRuleStatistics, type RuleStatistic } from './take-rule-statistics.js';
export { sortRuleStatistics } from './sort-rule-statistics.js';
export { filterRuleStatistics } from './filter-rule-statistics.js';

export function format(
  results: ESLint.LintResult[],
  data?: ESLint.LintResultData,
  options?: FormatByRulesOptions,
): string {
  return `${formatByFiles(results)}\n${formatByRules(results, data, options)}`;
}
