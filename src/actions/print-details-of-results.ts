import { Remote } from 'comlink';
import { ESLint } from 'eslint';
import { promptToInputDisplayMode } from '../cli/prompt';
import { EnhancedCore } from '../worker';

export async function doPrintDetailsOfResultsAction(
  core: Remote<EnhancedCore>,
  results: ESLint.LintResult[],
  selectedRuleIds: string[],
) {
  const displayMode = await promptToInputDisplayMode();
  await core.printDetailsOfResults(results, selectedRuleIds, displayMode);
}
