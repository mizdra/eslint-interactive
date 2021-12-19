import { ESLint } from 'eslint';
import { promptToInputRuleIds } from '../cli/prompt.js';
import { Core } from '../core.js';
import { NextScene } from '../types.js';
import { selectAction } from './select-action.js';

export type SelectRuleIdsArgs = {
  /** The lint results of the project */
  results: ESLint.LintResult[];
  /** The rule ids that are in the `results`. */
  ruleIdsInResults: string[];
};

/**
 * Run the scene where a user select rule ids.
 */
export async function selectRuleIds(core: Core, { results, ruleIdsInResults }: SelectRuleIdsArgs): Promise<NextScene> {
  const selectedRuleIds = await promptToInputRuleIds(ruleIdsInResults);
  return await selectAction(core, { results, ruleIdsInResults, selectedRuleIds });
}
