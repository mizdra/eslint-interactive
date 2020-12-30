import chalk from 'chalk';
import Table from 'cli-table';
import { ESLint } from 'eslint';
import terminalLink from 'terminal-link';
import { ERROR_COLOR, WARNING_COLOR } from './colors';
import { RuleStatistic } from './types';

export function printTable(
  ruleStatistics: RuleStatistic[],
  rulesMeta: ESLint.LintResultData['rulesMeta'],
): string {
  const table = new Table({
    head: ['Rule', 'Error (fixable)', 'Warning (fixable)'],
  });

  ruleStatistics.forEach((ruleStatistic) => {
    const {
      ruleId,
      errorCount,
      warningCount,
      fixableErrorCount,
      fixableWarningCount,
    } = ruleStatistic;
    const ruleMetaData = rulesMeta[ruleId];

    const ruleCell = ruleMetaData?.docs?.url
      ? terminalLink(ruleId, ruleMetaData?.docs.url)
      : ruleId;
    let errorCell = `${errorCount} (${fixableErrorCount})`;
    if (errorCount > 0) errorCell = chalk[ERROR_COLOR].bold(errorCell);
    let warningCell = `${warningCount} (${fixableWarningCount})`;
    if (warningCount > 0) warningCell = chalk[WARNING_COLOR].bold(warningCell);
    table.push([ruleCell, errorCell, warningCell]);
  });

  return table.toString();
}
