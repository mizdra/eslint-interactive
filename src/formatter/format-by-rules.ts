import chalk from 'chalk';
import Table from 'cli-table';
import { ESLint } from 'eslint';
// import terminalLink from 'terminal-link';
import { ERROR_COLOR } from './colors';
import { takeRuleStatistics } from './take-rule-statistics';

function numCell(num: number): string {
  return num > 0 ? chalk[ERROR_COLOR].bold(num) : num.toString();
}

export const formatByRules: ESLint.Formatter['format'] = (results, _data) => {
  const ruleStatistics = takeRuleStatistics(results);
  const table = new Table({
    head: ['Rule', 'Error', 'Warning', 'is fixable', 'has suggestions'],
  });

  ruleStatistics.forEach((ruleStatistic) => {
    const { ruleId, errorCount, warningCount, fixableCount, suggestApplicableCount } = ruleStatistic;

    // NOTE: Disable documentation links temporarily due to problems with cli-table.
    // ref: https://github.com/mizdra/eslint-interactive/issues/81
    // const ruleMetaData = data?.rulesMeta[ruleId];
    // const ruleCell = ruleMetaData?.docs?.url ? terminalLink(ruleId, ruleMetaData?.docs.url) : ruleId;
    const ruleCell = ruleId;
    table.push([
      ruleCell,
      numCell(errorCount),
      numCell(warningCount),
      numCell(fixableCount),
      numCell(suggestApplicableCount),
    ]);
  });

  return table.toString();
};
