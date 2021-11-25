import { prompt } from 'enquirer';
import { Action, DisplayMode } from '../types';

export async function promptToInputRuleIds(ruleIdsInResults: string[]): Promise<string[]> {
  const { ruleIds } = await prompt<{ ruleIds: string[] }>([
    {
      name: 'ruleIds',
      type: 'multiselect',
      message: 'Which rules would you like to apply action?',
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
      message: 'Which action do you want to do?',
      choices: [
        { name: 'displayMessages', message: 'Display problem messages' },
        { name: 'fix', message: 'Fix problems' },
        { name: 'disable', message: 'Disable problems with `// eslint-disable-next-line`' },
        { name: 'ApplySuggestions', message: 'Apply suggestion (experimental, only for experts)' },
        { name: 'reselectRules', message: 'Reselect rules' },
      ],
    },
  ]);
  return action;
}

export async function promptToInputDisplayMode(): Promise<DisplayMode> {
  const { displayMode } = await prompt<{
    displayMode: DisplayMode;
  }>([
    {
      name: 'displayMode',
      type: 'select',
      message: 'What format do you want to display the problem message in?',
      choices: [
        { name: 'withPager', message: 'Display with pager' },
        { name: 'withoutPager', message: 'Display without pager' },
      ],
    },
  ]);
  return displayMode;
}

export async function promptToInputDescription(): Promise<string | undefined> {
  const { description } = await prompt<{
    description: string;
  }>([
    {
      name: 'description',
      type: 'input',
      message: 'Leave a code comment with your reason for disabling (Optional)',
    },
  ]);
  return description === '' ? undefined : description;
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

export async function promptToInputReuseFilterScript(): Promise<boolean> {
  const { reuseFilterScript } = await prompt<{ reuseFilterScript: boolean }>([
    {
      name: 'reuseFilterScript',
      type: 'confirm',
      message: 'Do you want to reuse a previously edited filter script?',
      initial: true,
    },
  ]);
  return reuseFilterScript;
}
