/* istanbul ignore file */

import enquirer from 'enquirer';
import { ESLint } from 'eslint';
import { takeRuleStatistics } from '../formatter/index.js';

const { prompt } = enquirer;

// When combined with worker, for some reason the enquirer grabs the SIGINT and the process continues to survive.
// Therefore, the process is explicitly terminated.
const onCancel = () => process.exit();

/**
 * The type that indicates what to do with the problems of selected rules.
 */
export type Action =
  | 'printResultDetails'
  | 'fix'
  | 'disablePerLine'
  | 'disablePerFile'
  | 'applySuggestions'
  | 'reselectRules';

/**
 * The type representing how to display the lint results.
 *
 * `withPager` means that the lint results will be displayed with a pager (like `less` command).
 * `withoutPager` means that the lint results will be displayed without a pager.
 */
export type DisplayMode = 'withPager' | 'withoutPager';

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
      hint: 'Select all you want with <space> key.',
      choices: ruleIdsInResults,
      validate(value) {
        return value.length === 0 ? `Select at least one rule with <space> key.` : true;
      },
      onCancel,
    },
  ]);
  return ruleIds;
}

/**
 * Ask the user what action they want to perform.
 * @returns The action name
 */
export async function promptToInputAction(results: ESLint.LintResult[], selectedRuleIds: string[]): Promise<Action> {
  const ruleStatistics = takeRuleStatistics(results).filter((ruleStatistic) =>
    selectedRuleIds.includes(ruleStatistic.ruleId),
  );
  const foldedStatistics = ruleStatistics.reduce(
    (a, b) => ({
      isFixableCount: a.isFixableCount + b.isFixableCount,
      hasSuggestionsCount: a.hasSuggestionsCount + b.hasSuggestionsCount,
    }),
    { isFixableCount: 0, hasSuggestionsCount: 0 },
  );

  const { action } = await prompt<{
    action: Action;
  }>([
    {
      name: 'action',
      type: 'select',
      message: 'Which action do you want to do?',
      choices: [
        { name: 'printResultDetails', message: 'Display details of lint results' },
        { name: 'fix', message: 'Run `eslint --fix`', disabled: foldedStatistics.isFixableCount === 0 },
        { name: 'disablePerLine', message: 'Disable per line' },
        { name: 'disablePerFile', message: 'Disable per file' },
        {
          name: 'applySuggestions',
          message: 'Apply suggestions (experimental, for experts)',
          disabled: foldedStatistics.hasSuggestionsCount === 0,
        },
        {
          name: 'makeFixableAndFix',
          message: 'Make forcibly fixable and run `eslint --fix` (experimental, for experts)',
        },
        { name: 'reselectRules', message: 'Reselect rules' },
      ],
      onCancel,
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
      onCancel,
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
      onCancel,
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
      onCancel,
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
      onCancel,
    },
  ]);
  return reuseFilterScript;
}

/**
 * Ask the user if they want to reuse the script.
 * @returns If it reuses, `true`, if not, `false`.
 */
export async function promptToInputReuseScript(): Promise<boolean> {
  const { reuseScript } = await prompt<{ reuseScript: boolean }>([
    {
      name: 'reuseScript',
      type: 'confirm',
      message: 'Do you want to reuse a previously edited script?',
      initial: true,
      onCancel,
    },
  ]);
  return reuseScript;
}
