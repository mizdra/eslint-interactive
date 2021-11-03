import chalk from 'chalk';
import ora from 'ora';
import yargs from 'yargs/yargs';
import { doApplySuggestionAction } from './actions';
import { CachedESLint } from './eslint';
import {
  promptToInputAction,
  promptToInputContinue,
  promptToInputDescription,
  promptToInputDisplayMode,
  promptToInputRuleIds,
} from './prompt';
import { unique } from './util/array';
import { notEmpty } from './util/filter';

export type Options = {
  argv: string[];
};

export async function run(options: Options) {
  const argv = yargs(options.argv.slice(2))
    .usage('$0 [file.js] [dir]')
    .option('rulesdir', {
      type: 'array',
      describe: 'Use additional rules from this directory',
    })
    .nargs('rulesdir', 1)
    .option('ext', {
      type: 'array',
      describe: 'Specify JavaScript file extensions',
    })
    .nargs('ext', 1)
    .option('format', {
      type: 'string',
      describe: 'Specify the format to be used for the `Display problem messages` action',
      default: 'codeframe',
    }).argv;
  // NOTE: convert `string` type because yargs convert `'10'` (`string` type) into `10` (`number` type)
  // and `lintFiles` only accepts `string[]`.
  const patterns = argv._.map((pattern) => pattern.toString());
  const rulePaths = argv.rulesdir?.map((rulePath) => rulePath.toString());
  const extensions = argv.ext
    ?.map((extension) => extension.toString())
    // map '.js,.ts' into ['.js', '.ts']
    .flatMap((extension) => extension.split(','));
  const formatterName = argv.format;

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

        if (action === 'displayMessages') {
          const displayMode = await promptToInputDisplayMode();
          await eslint.showProblems(formatterName, displayMode, results, selectedRuleIds);
          continue selectAction;
        } else if (action === 'fix') {
          const fixingSpinner = ora('Fixing...').start();
          await eslint.fix(selectedRuleIds);
          fixingSpinner.succeed(chalk.bold('Fixing was successful.'));
          break selectRule;
        } else if (action === 'disable') {
          const description = await promptToInputDescription();
          const fixingSpinner = ora('Disabling...').start();
          await eslint.disable(results, selectedRuleIds, description);
          fixingSpinner.succeed(chalk.bold('Disabling was successful.'));
          break selectRule;
        } else if (action === 'applySuggestion') {
          await doApplySuggestionAction(eslint, results, selectedRuleIds);
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
