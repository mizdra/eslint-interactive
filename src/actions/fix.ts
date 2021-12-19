import chalk from 'chalk';
import ora from 'ora';
import { Core } from '../core.js';

export async function doFixAction(core: Core, selectedRuleIds: string[]) {
  const fixingSpinner = ora('Fixing...').start();
  await core.fix(selectedRuleIds);
  fixingSpinner.succeed(chalk.bold('Fixing was successful.'));
}
