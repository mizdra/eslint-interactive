import { ESLint } from 'eslint';
import { doApplySuggestionsAction } from '../actions/apply-suggestions.js';
import { doDisablePerFileAction } from '../actions/disable-per-file.js';
import { doDisablePerLineAction } from '../actions/disable-per-line.js';
import { doFixAction } from '../actions/fix.js';
import { doPrintDetailsOfResultsAction } from '../actions/print-details-of-results.js';
import { promptToInputAction } from '../cli/prompt.js';
import { Core } from '../core.js';
import { NextScene } from '../types.js';
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
  core: Core,
  { results, ruleIdsInResults, selectedRuleIds }: SelectActionArgs,
): Promise<NextScene> {
  const action = await promptToInputAction();

  if (action === 'reselectRules') return { name: 'selectRuleIds', args: { results, ruleIdsInResults } };

  if (action === 'printDetailsOfResults') {
    await doPrintDetailsOfResultsAction(core, results, selectedRuleIds);
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
  }
  return unreachable();
}
