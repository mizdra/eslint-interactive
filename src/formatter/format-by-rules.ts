// eslint-disable-next-line n/no-unsupported-features/node-builtins
import { styleText } from 'node:util';
import type { ESLint } from 'eslint';
import terminalLink from 'terminal-link';
import type { SortField, SortOrder } from '../type.js';
import { ERROR_COLOR } from './colors.js';
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

export type FormatByRulesSortOptions = {
  sort?: SortField | undefined;
  sortOrder?: SortOrder | undefined;
};

function numCell(num: number): string {
  return num > 0 ? styleText([ERROR_COLOR, 'bold'], num.toString()) : num.toString();
}

export function formatByRules(
  results: ESLint.LintResult[],
  data?: ESLint.LintResultData,
  sortOptions?: FormatByRulesSortOptions,
): string {
  let ruleStatistics = takeRuleStatistics(results);
  if (sortOptions?.sort) {
    ruleStatistics = sortRuleStatistics(ruleStatistics, sortOptions.sort, sortOptions.sortOrder);
  }

  const rows: Row[] = [];
  ruleStatistics.forEach((ruleStatistic) => {
    const { ruleId, errorCount, warningCount, isFixableCount, hasSuggestionsCount } = ruleStatistic;
    const ruleMetaData = data?.rulesMeta[ruleId];
    rows.push([
      ruleMetaData?.docs?.url ? terminalLink(ruleId, ruleMetaData?.docs.url, { fallback: false }) : ruleId,
      numCell(errorCount),
      numCell(warningCount),
      numCell(isFixableCount),
      numCell(hasSuggestionsCount),
    ]);
  });
  return formatTable(headerRow, rows);
}
