import { prompt } from 'enquirer';
import { Answers } from '../types';

export async function promptToInputAction(ruleIdsInStatistics: string[]) {
  // eslint-disable-next-line no-constant-condition
  while (true) {
    const { ruleIds } = await prompt<{ ruleIds: Answers['ruleIds'] }>([
      {
        name: 'ruleIds',
        type: 'multiselect',
        message: 'Which rule(s) would you like to apply action?',
        choices: ruleIdsInStatistics,
      },
    ]);

    const { action } = await prompt<{
      action: Answers['action'] | 'reselectRules';
    }>([
      {
        name: 'action',
        type: 'select',
        message: 'Which action do you want to apply?',
        choices: [
          { name: 'showMessages', message: 'Show error/warning messages' },
          { name: 'fix', message: 'Fix error/warning' },
          { name: 'reselectRules', message: 'Reselect rules' },
        ],
      },
    ]);

    if (action !== 'reselectRules') {
      return { ruleIds, action };
    }
  }
}
