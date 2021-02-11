import chalk from 'chalk';
import ora from 'ora';
import yargs from 'yargs/yargs';
import { CachedESLint } from './cached-eslint';
import { promptToInputAction, promptToInputContinue, promptToInputRuleIds } from './prompt';
import { unique } from './util/array';
import { notEmpty } from './util/filter';

export type Options = {
  argv: string[];
};

export async function run(options: Options) {
  const argv = yargs(options.argv.slice(2))
    .usage('$0 [file.js] [dir]')
    .option('ruledir', {
      type: 'array',
      describe: 'Use additional rules from this directory',
    })
    .option('ext', {
      type: 'array',
      describe: 'Specify JavaScript file extensions',
    }).argv;
  // NOTE: convert `string` type because yargs convert `'10'` (`string` type) into `10` (`number` type)
  // and `lintFiles` only accepts `string[]`.
  const patterns = argv._.map((pattern) => pattern.toString());
  const rulePaths = argv.ruledir?.map((rulePath) => rulePath.toString());
  const extensions = argv.ext
    ?.map((extension) => extension.toString())
    // map '.js,.ts' into ['.js', '.ts']
    .flatMap((extension) => extension.split(','));

  const eslint = new CachedESLint(patterns, { rulePaths, extensions });

  // eslint-disable-next-line no-constant-condition
  while (true) {
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
      break;
    }
    lintingSpinner.succeed(chalk.bold('Found errors.'));
    console.log();

    eslint.printResults(results);

    // eslint-disable-next-line no-constant-condition
    selectRule: while (true) {
      const selectedRuleIds = await promptToInputRuleIds(ruleIdsInResults);

      // eslint-disable-next-line no-constant-condition
      selectAction: while (true) {
        const action = await promptToInputAction();

        if (action === 'reselectRules') continue selectRule;

        if (action === 'showMessages') {
          await eslint.showErrorAndWarningMessages(results, selectedRuleIds);
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
}
