import chalk from 'chalk';
// eslint-disable-next-line @typescript-eslint/no-require-imports
import Table = require('cli-table');
import { ESLint } from 'eslint';
// import terminalLink from 'terminal-link';
import { ERROR_COLOR } from './colors.js';
import { takeRuleStatistics } from './take-rule-statistics.js';

function numCell(num: number): string {
  return num > 0 ? chalk[ERROR_COLOR].bold(num) : num.toString();
}

export function formatByRules(results: ESLint.LintResult[], _data?: ESLint.LintResultData): string {
  const ruleStatistics = takeRuleStatistics(results);
  const table = new Table({
    head: ['Rule', 'Error', 'Warning', 'is fixable', 'has suggestions'],
  });

  ruleStatistics.forEach((ruleStatistic) => {
    const { ruleId, errorCount, warningCount, isFixableCount, hasSuggestionsCount } = ruleStatistic;

    // NOTE: Disable documentation links temporarily due to problems with cli-table.
    // ref: https://github.com/mizdra/eslint-interactive/issues/81
    // const ruleMetaData = data?.rulesMeta[ruleId];
    // const ruleCell = ruleMetaData?.docs?.url ? terminalLink(ruleId, ruleMetaData?.docs.url) : ruleId;
    const ruleCell = ruleId;
    table.push([
      ruleCell,
      numCell(errorCount),
      numCell(warningCount),
      numCell(isFixableCount),
      numCell(hasSuggestionsCount),
    ]);
  });

  return table.toString();
}
