import yargs from 'yargs/yargs';
import { CachedESLint } from './eslint';
import { selectAction } from './scenes/select-action';
import { selectRuleIds } from './scenes/select-rule-ids';
import { selectToContinue } from './scenes/select-to-continue';
import { showLintResults } from './scenes/show-lint-results';
import { NextScene } from './types';

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

  let nextScene: NextScene = { name: 'showLintResults' };
  while (nextScene.name !== 'exit') {
    if (nextScene.name === 'showLintResults') {
      nextScene = await showLintResults(eslint);
    } else if (nextScene.name === 'selectRuleIds') {
      nextScene = await selectRuleIds(eslint, formatterName, nextScene.args);
    } else if (nextScene.name === 'selectAction') {
      nextScene = await selectAction(eslint, formatterName, nextScene.args);
    } else if (nextScene.name === 'selectToContinue') {
      nextScene = await selectToContinue();
    }
  }
}
