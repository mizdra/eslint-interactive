import { access, mkdir, readFile, writeFile } from 'node:fs/promises';
import { dirname } from 'node:path';
import type { Remote } from 'comlink';
import type { ESLint } from 'eslint';
import { promptToInputReuseScript } from '../cli/prompt.js';
import { fixingSpinner } from '../cli/spinner.js';
import type { Undo } from '../core.js';
import type { SerializableCore } from '../core-worker.js';
import {
  editFileWithEditor,
  generateExampleFixableMakerScriptFilePath,
  generateFixableMakerScriptFilePath,
} from '../util/filter-script.js';

export async function doMakeFixableAndFixAction(
  core: Remote<SerializableCore>,
  results: ESLint.LintResult[],
  selectedRuleIds: string[],
): Promise<Undo> {
  const exampleScript = await readFile(generateExampleFixableMakerScriptFilePath(), 'utf8');
  const fixableMakerScriptFilePath = generateFixableMakerScriptFilePath(selectedRuleIds);
  const isFixableMakerScriptExist = await access(fixableMakerScriptFilePath)
    .then(() => true)
    .catch(() => false);
  if (isFixableMakerScriptExist) {
    const reuseScript = await promptToInputReuseScript();
    if (!reuseScript) {
      await writeFile(fixableMakerScriptFilePath, exampleScript);
    }
  } else {
    await mkdir(dirname(fixableMakerScriptFilePath), { recursive: true }); // Create the directory because it might not exist
    await writeFile(fixableMakerScriptFilePath, exampleScript);
  }
  console.log('Opening editor...');

  const fixableMakerScript = await editFileWithEditor(fixableMakerScriptFilePath);
  const undo = await fixingSpinner(async () => core.makeFixableAndFix(results, selectedRuleIds, fixableMakerScript));
  return undo;
}
