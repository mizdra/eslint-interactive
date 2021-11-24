import { ESLint } from 'eslint';
import { promptToInputRuleIds } from '../cli/prompt';
import { ESLintProxy } from '../eslint-proxy';
import { NextScene } from '../types';
import { selectAction } from './select-action';

export type SelectRuleIdsArgs = {
  results: ESLint.LintResult[];
  ruleIdsInResults: string[];
};

export async function selectRuleIds(
  eslint: ESLintProxy,
  { results, ruleIdsInResults }: SelectRuleIdsArgs,
): Promise<NextScene> {
  const selectedRuleIds = await promptToInputRuleIds(ruleIdsInResults);
  return await selectAction(eslint, { results, ruleIdsInResults, selectedRuleIds });
}
