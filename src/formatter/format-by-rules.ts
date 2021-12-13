import chalk from 'chalk';
import Table from 'cli-table';
import { ESLint } from 'eslint';
import terminalLink from 'terminal-link';
import { ERROR_COLOR, WARNING_COLOR } from './colors.js';
import { takeRuleStatistics } from './take-rule-statistics.js';

export const formatByRules: ESLint.Formatter['format'] = (results, data) => {
  const ruleStatistics = takeRuleStatistics(results);
  const table = new Table({
    head: ['Rule', 'Error (fixable/suggest-applicable)', 'Warning (fixable/suggest-applicable)'],
  });

  ruleStatistics.forEach((ruleStatistic) => {
    const {
      ruleId,
      errorCount,
      warningCount,
      fixableErrorCount,
      fixableWarningCount,
      suggestApplicableErrorCount,
      suggestApplicableWarningCount,
    } = ruleStatistic;
    const ruleMetaData = data?.rulesMeta[ruleId];

    const ruleCell = ruleMetaData?.docs?.url ? terminalLink(ruleId, ruleMetaData?.docs.url) : ruleId;
    let errorCell = `${errorCount} (${fixableErrorCount}/${suggestApplicableErrorCount})`;
    if (errorCount > 0) errorCell = chalk[ERROR_COLOR].bold(errorCell);
    let warningCell = `${warningCount} (${fixableWarningCount}/${suggestApplicableWarningCount})`;
    if (warningCount > 0) warningCell = chalk[WARNING_COLOR].bold(warningCell);
    table.push([ruleCell, errorCell, warningCell]);
  });

  return table.toString();
};
