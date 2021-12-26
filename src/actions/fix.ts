import chalk from 'chalk';
import { Remote } from 'comlink';
import ora from 'ora';
import { EnhancedCore } from '../worker';

export async function doFixAction(core: Remote<EnhancedCore>, selectedRuleIds: string[]) {
  const fixingSpinner = ora('Fixing...').start();
  await core.fix(selectedRuleIds);
  fixingSpinner.succeed(chalk.bold('Fixing was successful.'));
}
