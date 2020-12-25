import { ESLint, Rule, Linter } from 'eslint';
import { groupBy } from './array';
import { RuleStatistic } from './types';

function convertRuleResult(
  ruleId: string,
  messages: Linter.LintMessage[],
  ruleModule: Rule.RuleModule | undefined,
): RuleStatistic {
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
    ruleModule,
    errorCount,
    warningCount,
    fixableErrorCount,
    fixableWarningCount,
  };
}

export function calcRuleStatistics(
  results: ESLint.LintResult[],
  ruleNameToRuleModule: Map<string, Rule.RuleModule>,
): RuleStatistic[] {
  const messages = results.flatMap((result) => result.messages);

  // NOTE: ruleId が null の可能性もあるので、ちゃんと考慮する
  const ruleIdToMessages = groupBy(
    messages,
    (message) => message.ruleId ?? 'null',
  );

  return [...ruleIdToMessages.entries()].map(([ruleId, messages]) => {
    return convertRuleResult(
      ruleId,
      messages,
      ruleNameToRuleModule.get(ruleId),
    );
  });
}
