import { prompt } from 'enquirer';
import { Action, DisplayMode } from '../types';

/**
 * Ask the user for the rule ids to which they want to apply the action.
 * @param ruleIdsInResults The rule ids that are in the lint results.
 * @returns The rule ids
 */
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

/**
 * Ask the user what action they want to perform.
 * @returns The action name
 */
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

/**
 * Ask the user how to display the lint results.
 * @returns How to display
 */
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

/**
 * Ask the user a description to leave in disable comment.
 * @returns The description
 */
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

/**
 * Ask the user continue running the program or not
 * @returns If it continues, `true`, if not, `false`.
 */
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

/**
 * Ask the user if they want to reuse the filter script.
 * @returns If it reuses, `true`, if not, `false`.
 */
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
