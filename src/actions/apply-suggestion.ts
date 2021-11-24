import { access, mkdir, readFile, writeFile } from 'fs/promises';
import { dirname } from 'path';
import chalk from 'chalk';
import { ESLint } from 'eslint';
import ora from 'ora';
import { promptToInputReuseFilterScript } from '../cli/prompt';
import { ESLintProxy } from '../eslint-proxy';
import {
  editFileWithEditor,
  generateExampleFilterScriptFilePath,
  generateFilterScriptFilePath,
} from '../util/filter-script';

export async function doApplySuggestionAction(
  eslint: ESLintProxy,
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
    // ディレクトリがない可能性を考慮して作成しておく
    await mkdir(dirname(filterScriptFilePath), { recursive: true });
    await writeFile(filterScriptFilePath, exampleScript);
  }
  console.log('Opening editor...');
  const filterScript = await editFileWithEditor(filterScriptFilePath);
  const fixingSpinner = ora('Applying suggestion...').start();
  await eslint.applySuggestions(results, selectedRuleIds, filterScript);
  fixingSpinner.succeed(chalk.bold('Applying suggestion was successful.'));
}
