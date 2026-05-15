/* istanbul ignore file */

import { isCancel, multiselect, select, text } from '@clack/prompts';
import type { ESLint } from 'eslint';
import { takeRuleStatistics } from '../formatter/index.js';

function exitIfCancel<T>(value: T | symbol): T {
  if (isCancel(value)) {
    // eslint-disable-next-line n/no-process-exit
    process.exit();
  }
  return value;
}

/**
 * The type that indicates what to do with the problems of selected rules.
 */
export type Action =
  | 'printResultDetails'
  | 'applyAutoFixes'
  | 'disablePerLine'
  | 'disablePerFile'
  | 'convertErrorToWarningPerFile'
  | 'relintAndReselectRules'
  | 'reselectRules';

/**
 * The type representing how to display the lint results.
 *
 * `printInTerminal` means to print the lint results in the terminal.
 * `printInTerminalWithPager` means to print the lint results in the terminal with a pager (e.g. `less`).
 * `writeToFile` means to write the lint results to a file.
 */
type DisplayMode = 'printInTerminal' | 'printInTerminalWithPager' | 'writeToFile';

/**
 * The type that represents what to do next.
 */
type NextStep = 'fixOtherRules' | 'exit' | 'undoTheFix';

export type DescriptionPosition = 'sameLine' | 'previousLine';

/**
 * Ask the user for the rule ids to which they want to apply the action.
 * @param ruleIdsInResults The rule ids that are in the lint results.
 * @returns The rule ids
 */
export async function promptToInputRuleIds(ruleIdsInResults: string[]): Promise<string[]> {
  return exitIfCancel(
    await multiselect<string>({
      message: 'Which rules would you like to apply action?',
      options: ruleIdsInResults.map((ruleId) => ({ value: ruleId })),
      required: true,
    }),
  );
}

/**
 * Ask the user what action they want to perform.
 * @returns The action name
 */
export async function promptToInputAction(
  results: ESLint.LintResult[],
  selectedRuleIds: string[],
  initialAction?: Action,
): Promise<Action> {
  const ruleStatistics = takeRuleStatistics(results).filter((ruleStatistic) =>
    selectedRuleIds.includes(ruleStatistic.ruleId),
  );
  const foldedStatistics = ruleStatistics.reduce(
    (a, b) => ({
      isFixableCount: a.isFixableCount + b.isFixableCount,
    }),
    { isFixableCount: 0 },
  );

  return exitIfCancel(
    await select<Action>({
      message: 'Which action do you want to do?',
      options: [
        { value: 'printResultDetails', label: '🔎 Display details of lint results' },
        { value: 'applyAutoFixes', label: '🔧 Run `eslint --fix`', disabled: foldedStatistics.isFixableCount === 0 },
        { value: 'disablePerLine', label: '🔧 Disable per line' },
        { value: 'disablePerFile', label: '🔧 Disable per file' },
        { value: 'convertErrorToWarningPerFile', label: '🔧 Convert error to warning per file' },
        { value: 'relintAndReselectRules', label: '↩️ Go back (with re-lint)' },
        { value: 'reselectRules', label: '↩️ Go back' },
      ],
      initialValue: initialAction,
    }),
  );
}

/**
 * Ask the user how to display the lint results.
 * @returns How to display
 */
export async function promptToInputDisplayMode(): Promise<DisplayMode> {
  return exitIfCancel(
    await select<DisplayMode>({
      message: 'In what way are the details displayed?',
      options: [
        { value: 'printInTerminal', label: '🖨  Print in terminal' },
        { value: 'printInTerminalWithPager', label: '↕️  Print in terminal with pager' },
        { value: 'writeToFile', label: '📝 Write to file' },
      ],
    }),
  );
}

/**
 * Ask the user a description to leave in directive.
 * @returns The description
 */
export async function promptToInputDescription(): Promise<string | undefined> {
  const description = exitIfCancel(
    await text({
      message: 'Leave a code comment with your reason for fixing (Optional)',
    }),
  );
  return description.trim() === '' ? undefined : description.trim();
}

/**
 * Ask the user a position of the description
 * @returns The description position
 */
export async function promptToInputDescriptionPosition(): Promise<DescriptionPosition> {
  return exitIfCancel(
    await select<DescriptionPosition>({
      message: 'Where would you like to position the code comment?',
      options: [
        { value: 'sameLine', label: "Same Line - Place on the same line as the eslint's disable comment." },
        { value: 'previousLine', label: "Previous Line - Place on the line before the eslint's disable comment." },
      ],
    }),
  );
}

/**
 * Ask the user what to do next.
 * @returns What to do next.
 */
export async function promptToInputWhatToDoNext(): Promise<NextStep> {
  return exitIfCancel(
    await select<NextStep>({
      message: "What's the next step?",
      options: [
        { value: 'fixOtherRules', label: '🔧 Fix other rules' },
        { value: 'undoTheFix', label: '↩️  Undo the fix' },
        { value: 'exit', label: '💚 Exit' },
      ],
    }),
  );
}
