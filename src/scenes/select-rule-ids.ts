import { Remote } from 'comlink';
import { ESLint } from 'eslint';
import { promptToInputRuleIds } from '../cli/prompt';
import { NextScene } from '../types';
import { SerializableCore } from '../worker';
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
  core: Remote<SerializableCore>,
  { results, ruleIdsInResults }: SelectRuleIdsArgs,
): Promise<NextScene> {
  const selectedRuleIds = await promptToInputRuleIds(ruleIdsInResults);
  return await selectAction(core, { results, ruleIdsInResults, selectedRuleIds });
}
