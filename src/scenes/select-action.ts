import { Remote } from 'comlink';
import { ESLint } from 'eslint';
import { doApplySuggestionsAction } from '../actions/apply-suggestions.js';
import { doDisablePerFileAction } from '../actions/disable-per-file.js';
import { doDisablePerLineAction } from '../actions/disable-per-line.js';
import { doFixAction } from '../actions/fix.js';
import { doMakeFixableAndFixAction } from '../actions/make-fixable-and-fix.js';
import { doPrintResultDetailsAction } from '../actions/print-result-details.js';
import { promptToInputAction } from '../cli/prompt.js';
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
};

/**
 * Run the scene where a user select the action to be performed for the problems of selected rules.
 */
export async function selectAction(
  core: Remote<SerializableCore>,
  { results, ruleIdsInResults, selectedRuleIds }: SelectActionArgs,
): Promise<NextScene> {
  const action = await promptToInputAction(results, selectedRuleIds);

  if (action === 'reselectRules') return { name: 'selectRuleIds', args: { results, ruleIdsInResults } };

  if (action === 'printResultDetails') {
    await doPrintResultDetailsAction(core, results, selectedRuleIds);
    return { name: 'selectAction', args: { results, ruleIdsInResults, selectedRuleIds } };
  } else if (action === 'fix') {
    await doFixAction(core, selectedRuleIds);
    return { name: 'selectToContinue' };
  } else if (action === 'disablePerLine') {
    await doDisablePerLineAction(core, results, selectedRuleIds);
    return { name: 'selectToContinue' };
  } else if (action === 'disablePerFile') {
    await doDisablePerFileAction(core, results, selectedRuleIds);
    return { name: 'selectToContinue' };
  } else if (action === 'applySuggestions') {
    await doApplySuggestionsAction(core, results, selectedRuleIds);
    return { name: 'selectToContinue' };
  } else if (action === 'makeFixableAndFix') {
    await doMakeFixableAndFixAction(core, results, selectedRuleIds);
    return { name: 'selectToContinue' };
  }
  // eslint-disable-next-line @typescript-eslint/restrict-template-expressions
  return unreachable(`unknown action: ${action}`);
}
