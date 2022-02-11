import { Remote } from 'comlink';
import { ESLint } from 'eslint';
import { doApplySuggestionsAction } from '../actions/apply-suggestions.js';
import { doDisablePerFileAction } from '../actions/disable-per-file.js';
import { doDisablePerLineAction } from '../actions/disable-per-line.js';
import { doFixAction } from '../actions/fix.js';
import { doMakeFixableAndFixAction } from '../actions/make-fixable-and-fix.js';
import { doPrintResultDetailsAction } from '../actions/print-result-details.js';
import { Action, promptToInputAction } from '../cli/prompt.js';
import { SerializableCore } from '../core-worker.js';
import { NextScene } from '../scenes/index.js';
import { unreachable } from '../util/type-check.js';

export type SelectActionArgs = {
  /** The lint results of the project */
  results: ESLint.LintResult[];
  /** The rule ids that are in the `results`. */
  ruleIdsInResults: string[];
  /** The rule ids to perform the action. */
  selectedRuleIds: string[];
  /** The action to be initially selected. */
  initialAction?: Action;
};

/**
 * Run the scene where a user select the action to be performed for the problems of selected rules.
 */
export async function selectAction(
  core: Remote<SerializableCore>,
  { results, ruleIdsInResults, selectedRuleIds, initialAction }: SelectActionArgs,
): Promise<NextScene> {
  const selectedAction = await promptToInputAction(results, selectedRuleIds, initialAction);

  const selectRuleIdsScene: NextScene = { name: 'selectRuleIds', args: { results, ruleIdsInResults } };
  const selectActionScene: NextScene = { name: 'selectAction', args: { results, ruleIdsInResults, selectedRuleIds } };
  const checkResultsScene: NextScene = {
    name: 'checkResults',
    args: { results, ruleIdsInResults, selectedRuleIds, selectedAction },
  };

  if (selectedAction === 'reselectRules') return selectRuleIdsScene;

  if (selectedAction === 'printResultDetails') {
    await doPrintResultDetailsAction(core, results, selectedRuleIds);
    return selectActionScene;
  } else if (selectedAction === 'fix') {
    await doFixAction(core, selectedRuleIds);
    return checkResultsScene;
  } else if (selectedAction === 'disablePerLine') {
    await doDisablePerLineAction(core, results, selectedRuleIds);
    return checkResultsScene;
  } else if (selectedAction === 'disablePerFile') {
    await doDisablePerFileAction(core, results, selectedRuleIds);
    return checkResultsScene;
  } else if (selectedAction === 'applySuggestions') {
    await doApplySuggestionsAction(core, results, selectedRuleIds);
    return checkResultsScene;
  } else if (selectedAction === 'makeFixableAndFix') {
    await doMakeFixableAndFixAction(core, results, selectedRuleIds);
    return checkResultsScene;
  }
  // eslint-disable-next-line @typescript-eslint/restrict-template-expressions
  return unreachable(`unknown action: ${selectedAction}`);
}
