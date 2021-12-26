import { Remote } from 'comlink';
import { ESLint } from 'eslint';
import { doApplySuggestionsAction } from '../actions/apply-suggestions';
import { doDisablePerFileAction } from '../actions/disable-per-file';
import { doDisablePerLineAction } from '../actions/disable-per-line';
import { doFixAction } from '../actions/fix';
import { doMakeFixableAndFixAction } from '../actions/make-fixable-and-fix';
import { doPrintDetailsOfResultsAction } from '../actions/print-details-of-results';
import { promptToInputAction } from '../cli/prompt';
import { Core } from '../core';
import { NextScene } from '../types';
import { unreachable } from '../util/type-check';

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
  core: Remote<Core>,
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
  } else if (action === 'makeFixableAndFix') {
    await doMakeFixableAndFixAction(core, results, selectedRuleIds);
    return { name: 'selectToContinue' };
  }
  return unreachable();
}
