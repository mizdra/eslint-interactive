import chalk from 'chalk';
import ora from 'ora';
import { ESLintProxy } from '../eslint-proxy';
import { NextScene } from '../types';
import { unique } from '../util/array';
import { notEmpty } from '../util/filter';

/**
 * Run the scene where the lint results will be printed.
 */
export async function showLintResults(eslint: ESLintProxy): Promise<NextScene> {
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
  eslint.printProblemSummary(results);
  return { name: 'selectRuleIds', args: { results, ruleIdsInResults } };
}
