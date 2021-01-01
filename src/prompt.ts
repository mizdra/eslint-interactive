import { prompt } from 'enquirer';
import { ESLint } from 'eslint';
import { Action } from './types';
import { unique } from './util/array';
import { notEmpty } from './util/filter';

export async function promptToInputRuleIds(
  results: ESLint.LintResult[],
): Promise<string[]> {
  const ruleIdsInResults = unique(
    results
      .flatMap((result) => result.messages)
      .flatMap((message) => message.ruleId)
      .filter(notEmpty),
  );

  const { ruleIds } = await prompt<{ ruleIds: string[] }>([
    {
      name: 'ruleIds',
      type: 'multiselect',
      message: 'Which rule(s) would you like to apply action?',
      choices: ruleIdsInResults,
    },
  ]);
  return ruleIds;
}

export async function promptToInputAction(): Promise<Action> {
  const { action } = await prompt<{
    action: Action;
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
  return action;
}

export async function promptToInputContinue(): Promise<boolean> {
  const { isContinue } = await prompt<{ isContinue: boolean }>([
    {
      name: 'isContinue',
      type: 'confirm',
      message: 'Continue?',
      initial: true,
    },
  ]);
  return isContinue;
}
