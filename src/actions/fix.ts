import chalk from 'chalk';
import ora from 'ora';
import { CachedESLint } from '../eslint';

export async function doFixAction(eslint: CachedESLint, selectedRuleIds: string[]) {
  const fixingSpinner = ora('Fixing...').start();
  await eslint.fixProblems(selectedRuleIds);
  fixingSpinner.succeed(chalk.bold('Fixing was successful.'));
}
