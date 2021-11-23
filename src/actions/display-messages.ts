import { ESLint } from 'eslint';
import { CachedESLint } from '../eslint';
import { promptToInputDisplayMode } from '../prompt';

export async function doDisplayMessagesAction(
  eslint: CachedESLint,
  formatterName: string,
  results: ESLint.LintResult[],
  selectedRuleIds: string[],
) {
  const displayMode = await promptToInputDisplayMode();
  await eslint.showProblems(formatterName, displayMode, results, selectedRuleIds);
}
