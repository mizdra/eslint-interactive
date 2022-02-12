import chalk from 'chalk';
import { Remote } from 'comlink';
import { ESLint } from 'eslint';
import { ora } from '../cli/ora.js';
import { SerializableCore } from '../core-worker.js';
import { Undo } from '../core.js';

export async function doFixAction(
  core: Remote<SerializableCore>,
  results: ESLint.LintResult[],
  selectedRuleIds: string[],
): Promise<Undo> {
  const fixingSpinner = ora('Fixing...').start();
  const undo = await core.applyAutoFixes(results, selectedRuleIds);
  fixingSpinner.succeed(chalk.bold('Fixing was successful.'));
  return undo;
}
