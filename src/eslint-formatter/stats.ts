import chalk from 'chalk';
import terminalLink from 'terminal-link';
import { RuleResult } from '../stat';

function getMaxRuleLength(ruleResults: RuleResult[]): number {
  const ruleLengths = ruleResults.map((ruleResult) => ruleResult.ruleId.length);
  // NOTE: ruleResults が 0 件でも UI が壊れないよう最小値は 0 に
  return Math.max(...ruleLengths, 0);
}

// それぞれのルールのエラーと警告の和の内、最も大きいものを返す
function getMaxErrorAndWarningCount(ruleResults: RuleResult[]): number {
  const errorAndWarningCounts = ruleResults.map(
    (ruleResult) => ruleResult.errorCount + ruleResult.warningCount,
  );
  // NOTE: ruleResults が 0 件でも UI が壊れないよう最小値は 0 に
  return Math.max(...errorAndWarningCounts, 0);
}

// それぞれのルールのfixableなエラーと警告の和の内、最も大きいものを返す
function getMaxFixableErrorAndWarningCount(ruleResults: RuleResult[]): number {
  const errorAndWarningCounts = ruleResults.map(
    (ruleResult) =>
      ruleResult.fixableErrorCount + ruleResult.fixableWarningCount,
  );
  // NOTE: ruleResults が 0 件でも UI が壊れないよう最小値は 0 に
  return Math.max(...errorAndWarningCounts, 0);
}

/** ruleResults を元にバーの長さの計算に必要なデータを計算する */
function getBarRatio(ruleResults: RuleResult[]) {
  const maxRuleLength = getMaxRuleLength(ruleResults);
  const maxErrorAndWarningCount = getMaxErrorAndWarningCount(ruleResults);
  const maxFixableErrorAndWarningCount = getMaxFixableErrorAndWarningCount(
    ruleResults,
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

export function getString(
  length: number,
  color: 'bgRed' | 'bgYellow' | 'hidden',
) {
  return chalk[color](' '.repeat(length));
}

type Choice = {
  name: string;
  message: string;
};

export function calcFormattedChoices(ruleResults: RuleResult[]): Choice[] {
  const {
    maxRuleLength,
    maxErrorAndWarningCountLength,
    barRatio,
  } = getBarRatio(ruleResults);

  const formattedChoices = ruleResults.map((ruleResult) => {
    const {
      ruleId,
      ruleModule,
      errorCount,
      warningCount,
      fixableErrorCount,
      fixableWarningCount,
    } = ruleResult;
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

  return formattedChoices;
}
