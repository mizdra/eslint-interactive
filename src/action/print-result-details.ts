import { writeFile } from 'node:fs/promises';
import { mkdir } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { stripVTControlCharacters, styleText } from 'node:util';
import type { Remote } from 'comlink';
import type { ESLint } from 'eslint';
import { VERSION } from '../cli/package.js';
import { pager } from '../cli/pager.js';
import { promptToInputDisplayMode } from '../cli/prompt.js';
import type { SerializableCore } from '../core-worker.js';
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
    const tempDir = getTempDir();
    const filePath = join(tempDir, 'lint-result-details.txt');
    await mkdir(tempDir, { recursive: true }); // Create the directory because it might not exist
    await writeFile(filePath, stripVTControlCharacters(formattedResultDetails), 'utf8');
    console.log(styleText('cyan', `Wrote to ${filePath}`));
  } else {
    // eslint-disable-next-line @typescript-eslint/restrict-template-expressions
    unreachable(`Unknown display mode: ${displayMode}`);
  }
}

function getTempDir(): string {
  return join(tmpdir(), 'eslint-interactive', VERSION);
}
