import { styleText } from 'node:util';
import type { ESLint } from 'eslint';
import terminalLink from 'terminal-link';
import { ERROR_COLOR } from './colors.js';
import { formatTable } from './format-table.js';
import { takeRuleStatistics } from './take-rule-statistics.js';

const headerRow = ['Rule', 'Error', 'Warning', 'is fixable', 'has suggestions'];

type Row = [
  ruleCell: string,
  errorCount: string,
  warningCount: string,
  isFixableCount: string,
  hasSuggestionsCount: string,
];

function numCell(num: number): string {
  return num > 0 ? styleText([ERROR_COLOR, 'bold'], num.toString()) : num.toString();
}

export function formatByRules(results: ESLint.LintResult[], data?: ESLint.LintResultData): string {
  const ruleStatistics = takeRuleStatistics(results);
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
