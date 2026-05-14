import type { ESLint } from 'eslint';
import { withProgress } from '../cli/log.js';
import type { Core, Undo } from '../core.js';

export async function doFixAction(core: Core, results: ESLint.LintResult[], selectedRuleIds: string[]): Promise<Undo> {
  const undo = await withProgress('Fixing...', async () => core.applyAutoFixes(results, selectedRuleIds));
  return undo;
}
