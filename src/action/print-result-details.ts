import { writeFile } from 'node:fs/promises';
import { join } from 'node:path';
// eslint-disable-next-line n/no-unsupported-features/node-builtins -- Ignore Node.js v21
import { stripVTControlCharacters, styleText } from 'node:util';
import type { Remote } from 'comlink';
import type { ESLint } from 'eslint';
import { pager } from '../cli/pager.js';
import { promptToInputDisplayMode } from '../cli/prompt.js';
import type { SerializableCore } from '../core-worker.js';
import { getCacheDir } from '../util/cache.js';
import { unreachable } from '../util/type-check.js';

export async function doPrintResultDetailsAction(
  core: Remote<SerializableCore>,
  results: ESLint.LintResult[],
  selectedRuleIds: string[],
) {
  const displayMode = await promptToInputDisplayMode();
  const formattedResultDetails = await core.formatResultDetails(results, selectedRuleIds);
  if (displayMode === 'printInTerminal') {
    console.log(formattedResultDetails);
  } else if (displayMode === 'printInTerminalWithPager') {
    await pager(formattedResultDetails);
  } else if (displayMode === 'writeToFile') {
    const filePath = join(getCacheDir(), 'lint-result-details.txt');
    await writeFile(filePath, stripVTControlCharacters(formattedResultDetails), 'utf8');
    console.log(styleText('cyan', `Wrote to ${filePath}`));
  } else {
    // eslint-disable-next-line @typescript-eslint/restrict-template-expressions
    unreachable(`Unknown display mode: ${displayMode}`);
  }
}
