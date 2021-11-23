import { ESLint } from 'eslint';
import { promptToInputRuleIds } from '../cli/prompt';
import { CachedESLint } from '../eslint';
import { NextScene } from '../types';
import { selectAction } from './select-action';

export type SelectRuleIdsArgs = {
  results: ESLint.LintResult[];
  ruleIdsInResults: string[];
};

export async function selectRuleIds(
  eslint: CachedESLint,
  formatterName: string,
  { results, ruleIdsInResults }: SelectRuleIdsArgs,
): Promise<NextScene> {
  const selectedRuleIds = await promptToInputRuleIds(ruleIdsInResults);
  return await selectAction(eslint, formatterName, { results, ruleIdsInResults, selectedRuleIds });
}
