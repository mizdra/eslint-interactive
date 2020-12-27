import chalk from 'chalk';
import Table from 'cli-table';
import terminalLink from 'terminal-link';
import { RuleStatistic } from '../types';
import { ERROR_COLOR, WARNING_COLOR } from './colors';

export function printTable(ruleStatistics: RuleStatistic[]): void {
  const table = new Table({
    head: ['Rule', 'Error (fixable)', 'Warning (fixable)'],
  });

  ruleStatistics.forEach((ruleStatistic) => {
    const {
      ruleId,
      ruleModule,
      errorCount,
      warningCount,
      fixableErrorCount,
      fixableWarningCount,
    } = ruleStatistic;
    const ruleCell = ruleModule?.meta?.docs?.url
      ? terminalLink(ruleId, ruleModule.meta.docs.url)
      : ruleId;
    let errorCell = `${errorCount} (${fixableErrorCount})`;
    if (errorCount > 0) errorCell = chalk[ERROR_COLOR].bold(errorCell);
    let warningCell = `${warningCount} (${fixableWarningCount})`;
    if (warningCount > 0) warningCell = chalk[WARNING_COLOR].bold(warningCell);
    table.push([ruleCell, errorCell, warningCell]);
  });

  console.log(table.toString());
}
