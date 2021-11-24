import { ESLint } from 'eslint';
import { promptToInputDisplayMode } from '../cli/prompt';
import { CachedESLint } from '../eslint';

export async function doDisplayMessagesAction(
  eslint: CachedESLint,
  results: ESLint.LintResult[],
  selectedRuleIds: string[],
) {
  const displayMode = await promptToInputDisplayMode();
  await eslint.showProblems(displayMode, results, selectedRuleIds);
}
