import { ESLint } from 'eslint';
import { promptToInputContinue } from '../cli/prompt';
import { NextScene } from '../types';

export type SelectRuleIdsArgs = {
  results: ESLint.LintResult[];
  ruleIdsInResults: string[];
};

export async function selectToContinue(): Promise<NextScene> {
  console.log();
  const isContinue = await promptToInputContinue();
  if (!isContinue) return { name: 'exit' };
  console.log();
  console.log('─'.repeat(process.stdout.columns));
  console.log();
  return { name: 'showLintResults' };
}
