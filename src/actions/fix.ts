import chalk from 'chalk';
import ora from 'ora';
import { ESLintDecorator } from '../eslint-decorator';

export async function doFixAction(eslint: ESLintDecorator, selectedRuleIds: string[]) {
  const fixingSpinner = ora('Fixing...').start();
  await eslint.fix(selectedRuleIds);
  fixingSpinner.succeed(chalk.bold('Fixing was successful.'));
}
