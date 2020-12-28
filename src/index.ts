#!/usr/bin/env node

import pager from 'node-pager';
import ora from 'ora';
import yargs from 'yargs/yargs';
import { CachedESLint } from './eslint/cached-eslint';
import { prompt } from './terminal/prompt';

const argv = yargs(process.argv.slice(2)).argv;
// NOTE: convert `string` type because yargs convert `'10'` (`string` type) into `10` (`number` type)
// and `lintFiles` only accepts `string[]`.
const patterns = argv._.map((pattern) => pattern.toString());

(async function main() {
  const eslint = new CachedESLint(patterns);

  // eslint-disable-next-line no-constant-condition
  while (true) {
    const lintingSpinner = ora('Linting...').start();
    const statistics = await eslint.lint();
    lintingSpinner.succeed('Linting was successful.');
    console.log();

    if (statistics.ruleStatistics.length === 0) break;

    eslint.printStatistics(statistics);

    const ruleIdsInStatistics = statistics.ruleStatistics.map(
      (ruleStatistic) => ruleStatistic.ruleId,
    );

    const answers = await prompt(ruleIdsInStatistics);

    if (answers.action === 'showMessages') {
      const formattedMessages = await eslint.formatErrorAndWarningMessages(
        statistics.results,
        answers.ruleIds,
      );
      await pager(formattedMessages);
    } else if (answers.action === 'fix') {
      const fixingSpinner = ora('Fixing...').start();
      await eslint.fix(answers.ruleIds);
      fixingSpinner.succeed('Fixing was successful.');
      console.log();
    }
    console.log('-'.repeat(process.stdout.columns));
  }
})().catch((error) => {
  process.exitCode = 1;
  console.error(error);
});
