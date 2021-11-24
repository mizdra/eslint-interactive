import { ESLint } from 'eslint';
import { promptToInputDisplayMode } from '../cli/prompt';
import { ESLintProxy } from '../eslint-proxy';

export async function doDisplayMessagesAction(
  eslint: ESLintProxy,
  results: ESLint.LintResult[],
  selectedRuleIds: string[],
) {
  const displayMode = await promptToInputDisplayMode();
  await eslint.printProblemDetails(displayMode, results, selectedRuleIds);
}
