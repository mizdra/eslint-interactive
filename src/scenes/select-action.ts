import { ESLint } from 'eslint';
import { doApplySuggestionsAction } from '../actions/apply-suggestions';
import { doDisableAction } from '../actions/disable';
import { doDisablePerFileAction } from '../actions/disable-per-file';
import { doDisplayMessagesAction } from '../actions/display-messages';
import { doFixAction } from '../actions/fix';
import { promptToInputAction } from '../cli/prompt';
import { ESLintDecorator } from '../eslint-decorator';
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
  eslint: ESLintDecorator,
  { results, ruleIdsInResults, selectedRuleIds }: SelectActionArgs,
): Promise<NextScene> {
  const action = await promptToInputAction();

  if (action === 'reselectRules') return { name: 'selectRuleIds', args: { results, ruleIdsInResults } };

  if (action === 'displayMessages') {
    await doDisplayMessagesAction(eslint, results, selectedRuleIds);
    return { name: 'selectAction', args: { results, ruleIdsInResults, selectedRuleIds } };
  } else if (action === 'fix') {
    await doFixAction(eslint, selectedRuleIds);
    return { name: 'selectToContinue' };
  } else if (action === 'disable') {
    await doDisableAction(eslint, results, selectedRuleIds);
    return { name: 'selectToContinue' };
  } else if (action === 'disablePerFile') {
    await doDisablePerFileAction(eslint, results, selectedRuleIds);
    return { name: 'selectToContinue' };
  } else if (action === 'ApplySuggestions') {
    await doApplySuggestionsAction(eslint, results, selectedRuleIds);
    return { name: 'selectToContinue' };
  }
  return unreachable();
}
