import { prompt as promptByEnquirer } from 'enquirer';
import { Answers } from '../types';

export async function prompt(ruleIdsInStatistics: string[]) {
  return await promptByEnquirer<Answers>([
    {
      name: 'ruleIds',
      type: 'multiselect',
      message: 'Which rule(s) would you like to do action?',
      choices: ruleIdsInStatistics,
    },
    {
      name: 'action',
      type: 'select',
      message: 'Which rule(s) would you like to fix?',
      choices: [
        { name: 'showMessages', message: 'Show error/warning messages' },
        { name: 'fix', message: 'Fix error/warning' },
      ],
    },
  ]);
}
