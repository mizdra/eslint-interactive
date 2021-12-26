import { Remote } from 'comlink';
import { ESLint } from 'eslint';
import { promptToInputDisplayMode } from '../cli/prompt';
import { Core } from '../core';

export async function doPrintDetailsOfResultsAction(
  core: Remote<Core>,
  results: ESLint.LintResult[],
  selectedRuleIds: string[],
) {
  const displayMode = await promptToInputDisplayMode();
  await core.printDetailsOfResults(results, selectedRuleIds, displayMode);
}
