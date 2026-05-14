import type { ESLint } from 'eslint';
import { withProgress } from '../cli/log.js';
import type { DescriptionPosition } from '../cli/prompt.js';
import { promptToInputDescription, promptToInputDescriptionPosition } from '../cli/prompt.js';
import type { Core, Undo } from '../core.js';

export async function doDisablePerLineAction(
  core: Core,
  results: ESLint.LintResult[],
  selectedRuleIds: string[],
): Promise<Undo> {
  const description = await promptToInputDescription();
  let descriptionPosition: DescriptionPosition;
  if (description) {
    descriptionPosition = await promptToInputDescriptionPosition();
  }
  const undo = await withProgress('Fixing...', async () =>
    core.disablePerLine(results, selectedRuleIds, description, descriptionPosition),
  );
  return undo;
}
