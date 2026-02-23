import type { Remote } from 'comlink';
import { error } from '../cli/log.js';
import { lintingSpinner } from '../cli/spinner.js';
import type { SerializableCore } from '../core-worker.js';
import type { NextScene } from './index.js';

/**
 * Run the scene to lint.
 */
export async function lint(core: Remote<SerializableCore>): Promise<NextScene> {
  const results = await lintingSpinner(async () => core.lint());
  console.log();

  // Check for ESLint core problems (ruleId === null) first.
  // These represent config errors, syntax errors, etc. that eslint-interactive cannot fix.
  const hasESLintCoreProblems = results.flatMap((result) => result.messages).some((message) => message.ruleId === null);
  if (hasESLintCoreProblems) {
    error(
      'ESLint Core Problems are found. ' +
        'The problems cannot be fixed by eslint-interactive. ' +
        'Check the details of the problem and fix it. ' +
        'This is usually caused by the invalid eslint config or the invalid syntax of the linted code.',
    );
    console.log(await core.formatResultDetails(results, [null]));
    // eslint-disable-next-line n/no-process-exit
    process.exit(1);
  }

  const ruleIdsInResults = await core.getSortedRuleIdsInResults(results);

  if (ruleIdsInResults.length === 0) {
    console.log('💚 No error found.');
    return { name: 'exit' };
  }
  console.log(await core.formatResultSummary(results));

  console.log();
  return { name: 'selectRuleIds', args: { results, ruleIdsInResults } };
}
