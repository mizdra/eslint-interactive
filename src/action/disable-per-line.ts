import chalk from 'chalk';
import { Remote } from 'comlink';
import { ESLint } from 'eslint';
import { ora } from '../cli/ora.js';
import { promptToInputDescription } from '../cli/prompt.js';
import { SerializableCore } from '../core-worker.js';
import { Undo } from '../core.js';

export async function doDisablePerLineAction(
  core: Remote<SerializableCore>,
  results: ESLint.LintResult[],
  selectedRuleIds: string[],
): Promise<Undo> {
  const description = await promptToInputDescription();
  const fixingSpinner = ora('Fixing...').start();
  const undo = await core.disablePerLine(results, selectedRuleIds, description);
  fixingSpinner.succeed(chalk.bold('Fixing was successful.'));
  return undo;
}
