import { ESLint } from 'eslint';
import { promptToInputDisplayMode } from '../cli/prompt.js';
import { Core } from '../core.js';

export async function doPrintDetailsOfResultsAction(
  core: Core,
  results: ESLint.LintResult[],
  selectedRuleIds: string[],
) {
  const displayMode = await promptToInputDisplayMode();
  await core.printDetailsOfResults(results, selectedRuleIds, displayMode);
}
