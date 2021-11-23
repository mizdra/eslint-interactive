import { ESLint } from 'eslint';
import { promptToInputDisplayMode } from '../cli/prompt';
import { CachedESLint } from '../eslint';

export async function doDisplayMessagesAction(
  eslint: CachedESLint,
  formatterName: string,
  results: ESLint.LintResult[],
  selectedRuleIds: string[],
) {
  const displayMode = await promptToInputDisplayMode();
  await eslint.showProblems(formatterName, displayMode, results, selectedRuleIds);
}
