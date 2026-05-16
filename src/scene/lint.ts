import { log } from '@clack/prompts';
import { error, withProgress } from '../cli/log.js';
import type { Core } from '../core.js';
import type { NextScene } from './index.js';

/**
 * Run the scene to lint.
 */
export async function lint(core: Core): Promise<NextScene> {
  const results = await withProgress('Linting', async () => core.lint());

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
    log.message(await core.formatResultDetails(results, [null]), {});
    // eslint-disable-next-line n/no-process-exit
    process.exit(1);
  }

  const ruleIdsInResults = core.getFilteredAndSortedRuleIds(results);

  if (ruleIdsInResults.length === 0) {
    const hasAnyMessage = results.some((result) => result.messages.length > 0);
    if (hasAnyMessage) {
      log.message('💚 No rules match the given --filter.');
    } else {
      log.message('💚 No rules with problems.');
    }
    return { name: 'exit' };
  }
  log.message(core.formatResultSummary(results));

  return { name: 'selectRuleIds', args: { results, ruleIdsInResults } };
}
