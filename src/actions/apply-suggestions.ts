import { access, mkdir, readFile, writeFile } from 'fs/promises';
import { dirname } from 'path';
import chalk from 'chalk';
import { ESLint } from 'eslint';
import ora from 'ora';
import { promptToInputReuseFilterScript } from '../cli/prompt.js';
import { Core } from '../core.js';
import { SuggestionFilter } from '../transforms/apply-suggestions.js';
import {
  editFileWithEditor,
  generateExampleFilterScriptFilePath,
  generateFilterScriptFilePath,
} from '../util/filter-script.js';

export async function doApplySuggestionsAction(
  core: Core,
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
  const filter = eval(filterScript) as SuggestionFilter;
  const fixingSpinner = ora('Applying suggestion...').start();
  await core.applySuggestions(results, selectedRuleIds, filter);
  fixingSpinner.succeed(chalk.bold('Applying suggestion was successful.'));
}
