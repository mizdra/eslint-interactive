import chalk from 'chalk';
import terminalLink from 'terminal-link';
import { Choice, RuleStatistic } from '../types';

function getMaxRuleLength(ruleStatistics: RuleStatistic[]): number {
  const ruleLengths = ruleStatistics.map(
    (ruleStatistic) => ruleStatistic.ruleId.length,
  );
  // NOTE: ruleStatistics が 0 件でも UI が壊れないよう最小値は 0 に
  return Math.max(...ruleLengths, 0);
}

// それぞれのルールのエラーと警告の和の内、最も大きいものを返す
function getMaxErrorAndWarningCount(ruleStatistics: RuleStatistic[]): number {
  const errorAndWarningCounts = ruleStatistics.map(
    (ruleStatistic) => ruleStatistic.errorCount + ruleStatistic.warningCount,
  );
  // NOTE: ruleStatistics が 0 件でも UI が壊れないよう最小値は 0 に
  return Math.max(...errorAndWarningCounts, 0);
}

// それぞれのルールのfixableなエラーと警告の和の内、最も大きいものを返す
function getMaxFixableErrorAndWarningCount(
  ruleStatistics: RuleStatistic[],
): number {
  const errorAndWarningCounts = ruleStatistics.map(
    (ruleStatistic) =>
      ruleStatistic.fixableErrorCount + ruleStatistic.fixableWarningCount,
  );
  // NOTE: ruleStatistics が 0 件でも UI が壊れないよう最小値は 0 に
  return Math.max(...errorAndWarningCounts, 0);
}

/** ruleStatistics を元にバーの長さの計算に必要なデータを計算する */
function getBarRatio(ruleStatistics: RuleStatistic[]) {
  const maxRuleLength = getMaxRuleLength(ruleStatistics);
  const maxErrorAndWarningCount = getMaxErrorAndWarningCount(ruleStatistics);
  const maxFixableErrorAndWarningCount = getMaxFixableErrorAndWarningCount(
    ruleStatistics,
  );
  const maxErrorAndWarningCountLength = maxErrorAndWarningCount.toString()
    .length;
  const maxFixableErrorAndWarningCountLength = maxFixableErrorAndWarningCount.toString()
    .length;
  const usedColumns =
    maxRuleLength +
    (maxFixableErrorAndWarningCountLength + 11) +
    (maxErrorAndWarningCountLength + 3);
  const maxBarLength = process.stdout.columns - usedColumns;
  // NOTE: UI が壊れないよう最大値は 1 に
  return {
    maxRuleLength,
    maxErrorAndWarningCountLength,
    maxFixableErrorAndWarningCountLength,
    usedColumns,
    barRatio: Math.min(1, maxBarLength / maxErrorAndWarningCount),
  };
}

export function generateChoices(ruleStatistics: RuleStatistic[]): Choice[] {
  const {
    maxRuleLength,
    maxErrorAndWarningCountLength,
    barRatio,
  } = getBarRatio(ruleStatistics);

  const choices = ruleStatistics.map((ruleStatistic) => {
    const {
      ruleId,
      ruleModule,
      errorCount,
      warningCount,
      fixableErrorCount,
      fixableWarningCount,
    } = ruleStatistic;
    // generate ruleCell
    const ruleLink = ruleModule?.meta?.docs?.url
      ? terminalLink(ruleId, ruleModule.meta.docs.url)
      : ruleId;
    const ruleCell =
      `${ruleLink}: ` + ' '.repeat(maxRuleLength - ruleId.length);

    // generate countCell
    const errorAndWarningCount = errorCount + warningCount;
    const fixableErrorAndWarningCount = fixableErrorCount + fixableWarningCount;
    const countCellText = `${errorAndWarningCount}(fixable: ${fixableErrorAndWarningCount})`;
    const countCell = chalk.magenta(
      countCellText.padStart(
        maxErrorAndWarningCountLength + fixableErrorAndWarningCount,
      ),
    );

    // generate barCell
    const errorBar = chalk.bgRed(' '.repeat(Math.floor(barRatio * errorCount)));
    const warningBar = chalk.bgYellow(
      ' '.repeat(Math.floor(barRatio * warningCount)),
    );

    return {
      name: ruleId,
      message: `${ruleCell}${countCell}|${errorBar}${warningBar}`,
    };
  });

  return choices;
}
