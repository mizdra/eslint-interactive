import type { Remote } from 'comlink';
import type { ESLint } from 'eslint';
import { fixingSpinner } from '../cli/ora.js';
import { promptToInputDescription } from '../cli/prompt.js';
import type { Undo } from '../core.js';
import type { SerializableCore } from '../core-worker.js';

export async function doConvertErrorToWarningPerFileAction(
  core: Remote<SerializableCore>,
  results: ESLint.LintResult[],
  selectedRuleIds: string[],
): Promise<Undo> {
  const description = await promptToInputDescription();
  const undo = await fixingSpinner(async () =>
    core.convertErrorToWarningPerFile(results, selectedRuleIds, description),
  );
  return undo;
}
