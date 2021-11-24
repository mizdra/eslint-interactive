import chalk from 'chalk';
import ora from 'ora';
import { ESLintProxy } from '../eslint-proxy';

export async function doFixAction(eslint: ESLintProxy, selectedRuleIds: string[]) {
  const fixingSpinner = ora('Fixing...').start();
  await eslint.fixProblems(selectedRuleIds);
  fixingSpinner.succeed(chalk.bold('Fixing was successful.'));
}
