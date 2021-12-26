import chalk from 'chalk';
import { Remote } from 'comlink';
import ora from 'ora';
import { Core } from '../core';

export async function doFixAction(core: Remote<Core>, selectedRuleIds: string[]) {
  const fixingSpinner = ora('Fixing...').start();
  await core.fix(selectedRuleIds);
  fixingSpinner.succeed(chalk.bold('Fixing was successful.'));
}
