import { prompt as promptByEnquirer } from 'enquirer';
import { Answers } from '../types';

export async function prompt(ruleIds: string[]) {
  return await promptByEnquirer<Answers>([
    {
      name: 'ruleIds',
      type: 'multiselect',
      message: 'Which rule(s) would you like to do action?',
      choices: ruleIds,
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
