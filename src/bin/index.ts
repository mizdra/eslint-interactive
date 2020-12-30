#!/usr/bin/env node

import chalk from 'chalk';
import pager from 'node-pager';
import ora from 'ora';
import yargs from 'yargs/yargs';
import { CachedESLint } from './eslint/cached-eslint';
import {
  promptToInputAction,
  promptToInputContinue,
  promptToInputRuleIds,
} from './terminal/prompt';

export function notEmpty<TValue>(
  value: TValue | null | undefined,
): value is TValue {
  return value !== null && value !== undefined;
}

const argv = yargs(process.argv.slice(2)).argv;
// NOTE: convert `string` type because yargs convert `'10'` (`string` type) into `10` (`number` type)
// and `lintFiles` only accepts `string[]`.
const patterns = argv._.map((pattern) => pattern.toString());

(async function main() {
  const eslint = new CachedESLint(patterns);

  // eslint-disable-next-line no-constant-condition
  while (true) {
    const lintingSpinner = ora('Linting...').start();
    const results = await eslint.lint();

    if (results.length === 0) {
      lintingSpinner.succeed(chalk.bold('No error found.'));
      break;
    }
    lintingSpinner.succeed(chalk.bold('Found errors.'));
    console.log();

    await eslint.printResults(results);

    const ruleIdsInResults = results
      .flatMap((result) => result.messages)
      .flatMap((message) => message.ruleId)
      .filter(notEmpty);

    // eslint-disable-next-line no-constant-condition
    selectRule: while (true) {
      const selectedRuleIds = await promptToInputRuleIds(ruleIdsInResults);

      // eslint-disable-next-line no-constant-condition
      selectAction: while (true) {
        const action = await promptToInputAction();

        if (action === 'reselectRules') continue selectRule;

        if (action === 'showMessages') {
          const formattedMessages = await eslint.formatErrorAndWarningMessages(
            results,
            selectedRuleIds,
          );
          await pager(formattedMessages);
          continue selectAction;
        } else if (action === 'fix') {
          const fixingSpinner = ora('Fixing...').start();
          await eslint.fix(selectedRuleIds);
          fixingSpinner.succeed(chalk.bold('Fixing was successful.'));
          break selectRule;
        }
      }
    }
    console.log();

    const isContinue = await promptToInputContinue();
    if (!isContinue) break;
    console.log();
    console.log('─'.repeat(process.stdout.columns));
    console.log();
  }
})().catch((error) => {
  process.exitCode = 1;
  console.error(error);
});
