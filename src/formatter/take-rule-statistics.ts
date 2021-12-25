import { ESLint, Linter } from 'eslint';
import { RuleStatistic } from '../types';
import { groupBy } from '../util/array';

/** 指定されたルールのエラー/警告の件数などの統計を取る */
function takeRuleStatistic(ruleId: string, messages: Linter.LintMessage[]): RuleStatistic {
  let errorCount = 0;
  let warningCount = 0;
  let fixableErrorCount = 0;
  let fixableWarningCount = 0;
  let suggestApplicableErrorCount = 0;
  let suggestApplicableWarningCount = 0;

  for (const message of messages) {
    if (message.severity === 2) {
      errorCount++;
      if (message.fix) fixableErrorCount++;
      if (message.suggestions && message.suggestions.length > 0) suggestApplicableErrorCount++;
    } else if (message.severity === 1) {
      warningCount++;
      if (message.fix) fixableWarningCount++;
      if (message.suggestions && message.suggestions.length > 0) suggestApplicableWarningCount++;
    }
  }

  return {
    ruleId,
    errorCount,
    warningCount,
    fixableCount: fixableErrorCount + fixableWarningCount,
    fixableErrorCount,
    fixableWarningCount,
    suggestApplicableCount: suggestApplicableErrorCount + suggestApplicableWarningCount,
    suggestApplicableErrorCount,
    suggestApplicableWarningCount,
  };
}

/** ルールごとのエラー/警告の件数などの統計を取る */
export function takeRuleStatistics(results: ESLint.LintResult[]): RuleStatistic[] {
  const messages = results.flatMap((result) => result.messages).filter((message) => message.ruleId !== null);

  const ruleIdToMessages = groupBy(messages, (message) => message.ruleId);

  const ruleStatistics: RuleStatistic[] = [];
  for (const [ruleId, messages] of ruleIdToMessages) {
    // NOTE: Exclude problems with a null `ruleId`.
    // ref: ref: https://github.com/eslint/eslint/blob/f1b7499a5162d3be918328ce496eb80692353a5a/docs/developer-guide/nodejs-api.md?plain=1#L372
    if (ruleId !== null) ruleStatistics.push(takeRuleStatistic(ruleId, messages));
  }
  return ruleStatistics;
}
