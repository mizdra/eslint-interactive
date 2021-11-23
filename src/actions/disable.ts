import chalk from 'chalk';
import { ESLint } from 'eslint';
import ora from 'ora';
import { CachedESLint } from '../eslint';
import { promptToInputDescription } from '../prompt';

export async function doDisableAction(eslint: CachedESLint, results: ESLint.LintResult[], selectedRuleIds: string[]) {
  const description = await promptToInputDescription();
  const fixingSpinner = ora('Disabling...').start();
  await eslint.disable(results, selectedRuleIds, description);
  fixingSpinner.succeed(chalk.bold('Disabling was successful.'));
}
