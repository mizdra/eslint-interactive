import { ESLint } from 'eslint';
import { promptToInputRuleIds } from '../cli/prompt';
import { ESLintDecorator } from '../eslint-decorator';
import { NextScene } from '../types';
import { selectAction } from './select-action';

export type SelectRuleIdsArgs = {
  /** The lint results of the project */
  results: ESLint.LintResult[];
  /** The rule ids that are in the `results`. */
  ruleIdsInResults: string[];
};

/**
 * Run the scene where a user select rule ids.
 */
export async function selectRuleIds(
  eslint: ESLintDecorator,
  { results, ruleIdsInResults }: SelectRuleIdsArgs,
): Promise<NextScene> {
  const selectedRuleIds = await promptToInputRuleIds(ruleIdsInResults);
  return await selectAction(eslint, { results, ruleIdsInResults, selectedRuleIds });
}
