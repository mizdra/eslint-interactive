import type { Remote } from 'comlink';
import type { ESLint } from 'eslint';
import { promptToInputRuleIds } from '../cli/prompt.js';
import type { SerializableCore } from '../core-worker.js';
import type { NextScene } from './index.js';
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
export async function selectRuleIds(
  core: Remote<SerializableCore>,
  { results, ruleIdsInResults }: SelectRuleIdsArgs,
): Promise<NextScene> {
  const selectedRuleIds = await promptToInputRuleIds(ruleIdsInResults);
  return selectAction(core, { results, ruleIdsInResults, selectedRuleIds });
}
