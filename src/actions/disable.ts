import chalk from 'chalk';
import { ESLint } from 'eslint';
import ora from 'ora';
import { promptToInputDescription } from '../cli/prompt';
import { ESLintProxy } from '../eslint-proxy';

export async function doDisableAction(eslint: ESLintProxy, results: ESLint.LintResult[], selectedRuleIds: string[]) {
  const description = await promptToInputDescription();
  const fixingSpinner = ora('Disabling...').start();
  await eslint.addDisableComments(results, selectedRuleIds, description);
  fixingSpinner.succeed(chalk.bold('Disabling was successful.'));
}
