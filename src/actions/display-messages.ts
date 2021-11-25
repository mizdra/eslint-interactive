import { ESLint } from 'eslint';
import { promptToInputDisplayMode } from '../cli/prompt';
import { ESLintDecorator } from '../eslint-decorator';

export async function doDisplayMessagesAction(
  eslint: ESLintDecorator,
  results: ESLint.LintResult[],
  selectedRuleIds: string[],
) {
  const displayMode = await promptToInputDisplayMode();
  await eslint.printProblemDetails(displayMode, results, selectedRuleIds);
}
