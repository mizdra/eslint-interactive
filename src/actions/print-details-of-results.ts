import { Remote } from 'comlink';
import { ESLint } from 'eslint';
import pager from 'node-pager';
import { promptToInputDisplayMode } from '../cli/prompt.js';
import { SerializableCore } from '../core-worker.js';

export async function doPrintDetailsOfResultsAction(
  core: Remote<SerializableCore>,
  results: ESLint.LintResult[],
  selectedRuleIds: string[],
) {
  const displayMode = await promptToInputDisplayMode();
  if (displayMode === 'withPager') {
    await pager(await core.formatResultDetails(results, selectedRuleIds));
  } else {
    console.log(await core.formatResultDetails(results, selectedRuleIds));
  }
}
