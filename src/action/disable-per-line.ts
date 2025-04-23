import type { Remote } from 'comlink';
import type { ESLint } from 'eslint';
import type { DescriptionPosition } from '../cli/prompt.js';
import { promptToInputDescription, promptToInputDescriptionPosition } from '../cli/prompt.js';
import { fixingSpinner } from '../cli/spinner.js';
import type { Undo } from '../core.js';
import type { SerializableCore } from '../core-worker.js';

export async function doDisablePerLineAction(
  core: Remote<SerializableCore>,
  results: ESLint.LintResult[],
  selectedRuleIds: string[],
): Promise<Undo> {
  const description = await promptToInputDescription();
  let descriptionPosition: DescriptionPosition;
  if (description) {
    descriptionPosition = await promptToInputDescriptionPosition();
  }
  const undo = await fixingSpinner(async () =>
    core.disablePerLine(results, selectedRuleIds, description, descriptionPosition),
  );
  return undo;
}
