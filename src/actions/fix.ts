import chalk from 'chalk';
import { Remote } from 'comlink';
import ora from 'ora';
import { SerializableCore } from '../core-worker';

export async function doFixAction(core: Remote<SerializableCore>, selectedRuleIds: string[]) {
  const fixingSpinner = ora('Fixing...').start();
  await core.fix(selectedRuleIds);
  fixingSpinner.succeed(chalk.bold('Fixing was successful.'));
}
