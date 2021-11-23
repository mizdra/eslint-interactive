import chalk from 'chalk';
import { ESLint } from 'eslint';
import ora from 'ora';
import { CachedESLint } from '../eslint';
import { NextScene } from '../types';
import { unique } from '../util/array';
import { notEmpty } from '../util/filter';

export type SelectRuleIdsArgs = {
  results: ESLint.LintResult[];
  ruleIdsInResults: string[];
};

export async function showLintResults(eslint: CachedESLint): Promise<NextScene> {
  const lintingSpinner = ora('Linting...').start();
  const results = await eslint.lint();
  const ruleIdsInResults = unique(
    results
      .flatMap((result) => result.messages)
      .flatMap((message) => message.ruleId)
      .filter(notEmpty),
  );

  if (ruleIdsInResults.length === 0) {
    lintingSpinner.succeed(chalk.bold('No error found.'));
    return { name: 'exit' };
  }
  lintingSpinner.succeed(chalk.bold('Found errors.'));
  console.log();
  eslint.printResults(results);
  return { name: 'selectRuleIds', args: { results, ruleIdsInResults } };
}
