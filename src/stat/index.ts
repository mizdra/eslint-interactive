import { ESLint, Rule, Linter } from 'eslint';

export type RuleResult = {
  ruleId: string;
  ruleModule: Rule.RuleModule | undefined;
  errorCount: number;
  warningCount: number;
  fixableErrorCount: number;
  fixableWarningCount: number;
};

function groupBy<T, K>(array: T[], toKey: (item: T) => K): Map<K, T[]> {
  const map = new Map<K, T[]>();

  for (const item of array) {
    const key = toKey(item);
    const oldValue = map.get(key);
    const newValue = oldValue ? [...oldValue, item] : [item];
    map.set(key, newValue);
  }

  return map;
}

function convertRuleResult(
  ruleId: string,
  messages: Linter.LintMessage[],
  ruleModule: Rule.RuleModule | undefined,
): RuleResult {
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

export function calcRuleResults(
  results: ESLint.LintResult[],
  ruleNameToRuleModule: Map<string, Rule.RuleModule>,
): RuleResult[] {
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
