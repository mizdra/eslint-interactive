import { access, mkdir, readFile, writeFile } from 'fs/promises';
import { dirname } from 'path';
import chalk from 'chalk';
import { ESLint } from 'eslint';
import ora from 'ora';
import { promptToInputReuseScript } from '../cli/prompt';
import { Core } from '../core';
import { FixableMaker } from '../transforms/make-fixable-and-fix';
import {
  editFileWithEditor,
  generateExampleFixableMakerScriptFilePath,
  generateFixableMakerScriptFilePath,
} from '../util/filter-script';

export async function doMakeFixableAndFixAction(
  core: Core,
  results: ESLint.LintResult[],
  selectedRuleIds: string[],
): Promise<void> {
  const exampleScript = await readFile(generateExampleFixableMakerScriptFilePath(), 'utf8');
  const fixableMakerScriptFilePath = generateFixableMakerScriptFilePath(selectedRuleIds);
  const isFixableMakerScriptExist = await access(fixableMakerScriptFilePath)
    .then(() => true)
    .catch(() => false);
  if (isFixableMakerScriptExist) {
    const reuseScript = await promptToInputReuseScript();
    if (!reuseScript) {
      await writeFile(fixableMakerScriptFilePath, exampleScript);
    }
  } else {
    // ディレクトリがない可能性を考慮して作成しておく
    await mkdir(dirname(fixableMakerScriptFilePath), { recursive: true });
    await writeFile(fixableMakerScriptFilePath, exampleScript);
  }
  console.log('Opening editor...');

  const fixableMakerScript = await editFileWithEditor(fixableMakerScriptFilePath);
  const fixableMaker = eval(fixableMakerScript) as FixableMaker;
  const fixingSpinner = ora('Making fixable and fixing...').start();
  await core.makeFixableAndFix(results, selectedRuleIds, fixableMaker);
  fixingSpinner.succeed(chalk.bold('Making fixable and fixing was successful.'));
}
