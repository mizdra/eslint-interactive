import { access, readFile, writeFile } from 'fs/promises';
import chalk from 'chalk';
import { ESLint } from 'eslint';
import ora from 'ora';
import { CachedESLint } from './eslint';
import {
  editFileWithEditor,
  generateExampleFilterScriptFilePath,
  generateFilterScriptFilePath,
} from './filter-script-util';
import { promptToInputReuseFilterScript } from './prompt';

export async function doApplySuggestionAction(
  eslint: CachedESLint,
  results: ESLint.LintResult[],
  selectedRuleIds: string[],
): Promise<void> {
  const exampleScript = await readFile(generateExampleFilterScriptFilePath(), 'utf8');
  const filterScriptFilePath = generateFilterScriptFilePath(selectedRuleIds);
  const isFilterScriptExist = await access(filterScriptFilePath)
    .then(() => true)
    .catch(() => false);
  if (isFilterScriptExist) {
    const reuseFilterScript = await promptToInputReuseFilterScript();
    if (!reuseFilterScript) {
      await writeFile(filterScriptFilePath, exampleScript);
    }
  } else {
    await writeFile(filterScriptFilePath, exampleScript);
  }
  console.log('Opening editor...');
  const filterScript = await editFileWithEditor(filterScriptFilePath);
  const fixingSpinner = ora('Applying suggestion...').start();
  await eslint.applySuggestion(results, selectedRuleIds, filterScript);
  fixingSpinner.succeed(chalk.bold('Applying suggestion was successful.'));
}
