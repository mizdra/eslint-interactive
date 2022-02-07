import { Remote } from 'comlink';
import { ESLint } from 'eslint';
import { promptToInputWhatToDoNext } from '../cli/prompt.js';
import { SerializableCore } from '../core-worker.js';
import { NextScene } from '../scenes/index.js';

export type SelectNextStepArgs = {
  /** The lint results of the project */
  results: ESLint.LintResult[];
  /** The rule ids that are in the `results`. */
  ruleIdsInResults: string[];
  /** The rule ids to perform the action. */
  selectedRuleIds: string[];
};

/**
 * Run the scene where a user select to continue running the program or not.
 */
export async function selectToContinue(
  core: Remote<SerializableCore>,
  { results, ruleIdsInResults, selectedRuleIds }: SelectNextStepArgs,
): Promise<NextScene> {
  console.log();
  const nextStep = await promptToInputWhatToDoNext();
  if (nextStep === 'exit') return { name: 'exit' };
  if (nextStep === 'undoTheFix') {
    await core.undoTransformation(results);
    return { name: 'selectAction', args: { results, ruleIdsInResults, selectedRuleIds } };
  }
  console.log();
  console.log('─'.repeat(process.stdout.columns));
  console.log();
  return { name: 'lint' };
}
