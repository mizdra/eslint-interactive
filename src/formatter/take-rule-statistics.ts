import { ESLint, Linter } from 'eslint';
import { RuleStatistic } from '../types';
import { groupBy } from '../util/array';

/** 指定されたルールのエラー/警告の件数などの統計を取る */
function takeRuleStatistic(ruleId: string, messages: Linter.LintMessage[]): RuleStatistic {
  let errorCount = 0;
  let warningCount = 0;
  let fixableErrorCount = 0;
  let fixableWarningCount = 0;

  for (const message of messages) {
    if (message.severity === 2) {
      errorCount++;
      if (message.fix !== undefined) fixableErrorCount++;
    } else if (message.severity === 1) {
      warningCount++;
      if (message.fix !== undefined) fixableWarningCount++;
    }
  }

  return {
    ruleId,
    errorCount,
    warningCount,
    fixableErrorCount,
    fixableWarningCount,
  };
}

/** ルールごとのエラー/警告の件数などの統計を取る */
export function takeRuleStatistics(results: ESLint.LintResult[]): RuleStatistic[] {
  const messages = results.flatMap((result) => result.messages);

  // NOTE: ruleId が null の可能性もあるので、ちゃんと考慮する
  const ruleIdToMessages = groupBy(messages, (message) => message.ruleId ?? 'null');

  return [...ruleIdToMessages.entries()].map(([ruleId, messages]) => {
    return takeRuleStatistic(ruleId, messages);
  });
}
