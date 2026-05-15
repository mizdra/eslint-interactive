import type { ESLint } from 'eslint';
import { withProgress } from '../cli/log.js';
import { promptToInputDescription } from '../cli/prompt.js';
import type { Core, Undo } from '../core.js';

export async function doConvertErrorToWarningPerFileAction(
  core: Core,
  results: ESLint.LintResult[],
  selectedRuleIds: string[],
): Promise<Undo> {
  const description = await promptToInputDescription();
  const undo = await withProgress('Fixing', async () =>
    core.convertErrorToWarningPerFile(results, selectedRuleIds, description),
  );
  return undo;
}
