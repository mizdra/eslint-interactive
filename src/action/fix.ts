import type { Remote } from 'comlink';
import type { ESLint } from 'eslint';
import { fixingSpinner } from '../cli/ora.js';
import type { Undo } from '../core.js';
import type { SerializableCore } from '../core-worker.js';

export async function doFixAction(
  core: Remote<SerializableCore>,
  results: ESLint.LintResult[],
  selectedRuleIds: string[],
): Promise<Undo> {
  const undo = await fixingSpinner(async () => core.applyAutoFixes(results, selectedRuleIds));
  return undo;
}
