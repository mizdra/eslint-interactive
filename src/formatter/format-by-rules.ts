// eslint-disable-next-line n/no-unsupported-features/node-builtins
import { styleText } from 'node:util';
import type { ESLint } from 'eslint';
import type { FilterCriterion, SortField, SortOrder } from '../type.js';
import { terminalLink } from '../util/terminal-link.js';
import { ERROR_COLOR } from './colors.js';
import { filterRuleStatistics } from './filter-rule-statistics.js';
import { formatTable } from './format-table.js';
import { sortRuleStatistics } from './sort-rule-statistics.js';
import { takeRuleStatistics } from './take-rule-statistics.js';

const headerRow = ['Rule', 'Error', 'Warning', 'is fixable', 'has suggestions'];

type Row = [
  ruleCell: string,
  errorCount: string,
  warningCount: string,
  isFixableCount: string,
  hasSuggestionsCount: string,
];

export type FormatByRulesOptions = {
  sort?: SortField | undefined;
  sortOrder?: SortOrder | undefined;
  filters?: FilterCriterion[] | undefined;
};

function numCell(num: number): string {
  return num > 0 ? styleText([ERROR_COLOR, 'bold'], num.toString()) : num.toString();
}

export function formatByRules(
  results: ESLint.LintResult[],
  data?: ESLint.LintResultData,
  options?: FormatByRulesOptions,
): string {
  let ruleStatistics = takeRuleStatistics(results);
  ruleStatistics = filterRuleStatistics(ruleStatistics, options?.filters);
  if (options?.sort) {
    ruleStatistics = sortRuleStatistics(ruleStatistics, options.sort, options.sortOrder);
  }

  const rows: Row[] = [];
  ruleStatistics.forEach((ruleStatistic) => {
    const { ruleId, errorCount, warningCount, isFixableCount, hasSuggestionsCount } = ruleStatistic;
    const ruleMetaData = data?.rulesMeta[ruleId];
    rows.push([
      ruleMetaData?.docs?.url ? terminalLink(ruleId, ruleMetaData?.docs.url) : ruleId,
      numCell(errorCount),
      numCell(warningCount),
      numCell(isFixableCount),
      numCell(hasSuggestionsCount),
    ]);
  });
  return formatTable(headerRow, rows);
}
