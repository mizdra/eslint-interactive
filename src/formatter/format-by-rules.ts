import chalk from 'chalk';
import { ESLint } from 'eslint';
// eslint-disable-next-line @typescript-eslint/no-require-imports
import table = require('table');
// import terminalLink from 'terminal-link';
import { ERROR_COLOR } from './colors.js';
import { takeRuleStatistics } from './take-rule-statistics.js';

type Row = [
  ruleCell: string,
  errorCount: string,
  warningCount: string,
  isFixableCount: string,
  hasSuggestionsCount: string,
];

function numCell(num: number): string {
  return num > 0 ? chalk[ERROR_COLOR].bold(num) : num.toString();
}

export function formatByRules(results: ESLint.LintResult[], _data?: ESLint.LintResultData): string {
  const ruleStatistics = takeRuleStatistics(results);

  const rows: Row[] = [];

  // header
  rows.push(['Rule', 'Error', 'Warning', 'is fixable', 'has suggestions']);

  ruleStatistics.forEach((ruleStatistic) => {
    const { ruleId, errorCount, warningCount, isFixableCount, hasSuggestionsCount } = ruleStatistic;

    // NOTE: Disable documentation links temporarily due to problems with cli-table.
    // ref: https://github.com/mizdra/eslint-interactive/issues/81
    // const ruleMetaData = data?.rulesMeta[ruleId];
    // const ruleCell = ruleMetaData?.docs?.url ? terminalLink(ruleId, ruleMetaData?.docs.url) : ruleId;
    const ruleCell = ruleId;
    rows.push([
      ruleCell,
      numCell(errorCount),
      numCell(warningCount),
      numCell(isFixableCount),
      numCell(hasSuggestionsCount),
    ]);
  });

  return table.table(rows);
}
