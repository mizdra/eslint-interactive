import { ESLint, Linter } from 'eslint';
import countBy from 'lodash/countBy';
import groupBy from 'lodash/groupBy';
import mapValues from 'lodash/mapValues';
import { names } from './severities';

export type SeverityToCount = {
  off: number;
  warnings: number;
  errors: number;
};
function getStatsForRule(ruleMessages: Linter.LintMessage[]): SeverityToCount {
  return countBy(
    ruleMessages,
    (message) => names[message.severity],
  ) as SeverityToCount;
}

export type RuleIdToSeverityToCount = {
  [ruleId: string]: SeverityToCount;
};

export function byRule(results: ESLint.LintResult[]): RuleIdToSeverityToCount {
  const allMessages = results.flatMap((result) => result.messages);
  const messagesByRuleId = groupBy(allMessages, 'ruleId');
  return mapValues(messagesByRuleId, getStatsForRule);
}
