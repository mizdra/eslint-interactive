import { ESLint } from 'eslint';
import { promptToInputDisplayMode } from '../cli/prompt';
import { Core } from '../core';

export async function doPrintDetailsOfResultsAction(
  core: Core,
  results: ESLint.LintResult[],
  selectedRuleIds: string[],
) {
  const displayMode = await promptToInputDisplayMode();
  await core.printDetailsOfResults(results, selectedRuleIds, displayMode);
}
