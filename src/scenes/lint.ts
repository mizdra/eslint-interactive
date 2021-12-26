import chalk from 'chalk';
import { Remote } from 'comlink';
import ora from 'ora';
import { warn } from '../cli/log';
import { SerializableCore } from '../core-worker';
import { NextScene } from '../types';
import { unique } from '../util/array';
import { notEmpty } from '../util/type-check';

/**
 * Run the scene to lint.
 */
export async function lint(core: Remote<SerializableCore>): Promise<NextScene> {
  const lintingSpinner = ora('Linting...').start();
  const results = await core.lint();
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
  await core.printSummaryOfResults(results);

  const hasESLintCoreProblems = results.flatMap((result) => result.messages).some((message) => message.ruleId === null);
  if (hasESLintCoreProblems) {
    warn(
      'ESLint Core Problems are found. ' +
        'The problems cannot be fixed by eslint-interactive. ' +
        'Check the details of the problem and fix it. ' +
        'This is usually caused by the invalid eslintrc or the invalid syntax of the linted code.',
    );
    await core.printDetailsOfResults(results, [null], 'withoutPager');
  }
  return { name: 'selectRuleIds', args: { results, ruleIdsInResults } };
}
