import chalk from 'chalk';
import _ from 'lodash';
import { getString } from './bar';
import { RuleIdToSeverityToCount, SeverityToCount } from './stats';

const barColors = {
  errors: 'bgRed',
  warnings: 'bgYellow',
  off: 'hidden',
} as const;

function getMaxRuleLength(stats: RuleIdToSeverityToCount): number {
  return _(stats).keys().map('length').max() ?? 0;
}

const getBarRatio = (
  usedColumns: number,
  maxResult: number,
  maxWidth: number,
) => {
  const maxBarLength = maxWidth - usedColumns;
  return maxResult <= maxBarLength ? 1 : maxBarLength / maxResult;
};

const sortByKey = (obj: any) =>
  // eslint-disable-next-line @typescript-eslint/no-unsafe-return,@typescript-eslint/no-unsafe-member-access,@typescript-eslint/no-unsafe-call
  _(obj).keys().sortBy().map(_.propertyOf(obj)).value();

export function getObjectOutput(
  stats: RuleIdToSeverityToCount,
  maxWidth: number,
) {
  const maxRuleLength = getMaxRuleLength(stats);
  // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
  const maxResult =
    _(stats)
      // eslint-disable-next-line @typescript-eslint/no-unsafe-return
      .flatMap((ruleStats) => [ruleStats.errors ?? 0, ruleStats.warnings ?? 0])
      .max() ?? 0;
  const maxResultLength = String(maxResult).length;

  const barRatio = getBarRatio(
    maxRuleLength + maxResultLength + 3,
    maxResult,
    maxWidth,
  );

  function getRuleOutput(
    ruleStats: SeverityToCount,
    ruleName: keyof RuleIdToSeverityToCount,
  ): string {
    const ruleCell = `${ruleName}: `.padEnd(maxRuleLength + 2);
    return _.map(ruleStats, (count, severity: keyof SeverityToCount) => {
      const countCell = chalk.magenta(
        _.padStart(count.toString(), maxResultLength),
      );
      const barCell = getString(
        Math.floor(barRatio * count),
        barColors[severity],
      );
      return `${ruleCell}${countCell}|${barCell}`;
    }).join('\n');
  }

  return `${sortByKey(_.mapValues(stats, getRuleOutput)).join('\n')}\n`;
}
