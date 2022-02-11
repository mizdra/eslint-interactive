import { Remote } from 'comlink';
import { ESLint } from 'eslint';
import { Action, promptToInputWhatToDoNext } from '../cli/prompt.js';
import { SerializableCore } from '../core-worker.js';
import { NextScene } from './index.js';

export type CheckResultsArgs = {
  /** The lint results of the project */
  results: ESLint.LintResult[];
  /** The rule ids that are in the `results`. */
  ruleIdsInResults: string[];
  /** The rule ids to perform the action. */
  selectedRuleIds: string[];
  /** The selected actions. */
  selectedAction: Action;
};

/**
 * Run the scene where a user check the transformation results.
 */
export async function checkResults(
  core: Remote<SerializableCore>,
  { results, ruleIdsInResults, selectedRuleIds, selectedAction }: CheckResultsArgs,
): Promise<NextScene> {
  console.log();
  const nextStep = await promptToInputWhatToDoNext();
  if (nextStep === 'exit') return { name: 'exit' };
  if (nextStep === 'undoTheFix') {
    await core.undoTransformation(results);
    return {
      name: 'selectAction',
      args: { results, ruleIdsInResults, selectedRuleIds, initialAction: selectedAction },
    };
  }
  console.log();
  console.log('─'.repeat(process.stdout.columns));
  console.log();
  return { name: 'lint' };
}
