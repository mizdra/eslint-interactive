import chalk from 'chalk';
import isInstalledGlobally from 'is-installed-globally';
import { parseArgv } from './cli/parse-argv';
import { Core } from './core';
import { lint } from './scenes/lint';
import { selectAction } from './scenes/select-action';
import { selectRuleIds } from './scenes/select-rule-ids';
import { selectToContinue } from './scenes/select-to-continue';
import { NextScene } from './types';

export type Options = {
  argv: string[];
};

/**
 * Run eslint-interactive.
 */
export async function run(options: Options) {
  if (isInstalledGlobally) {
    console.log(
      chalk.bold.yellowBright(
        'WARNING: eslint-interactive is installed globally. ' +
          'The globally installed eslint-interactive is not officially supported because some features do not work. ' +
          'It is recommended to install eslint-interactive locally.\n',
      ),
    );
  }
  const config = parseArgv(options.argv);
  const core = new Core(config);

  let nextScene: NextScene = { name: 'lint' };
  while (nextScene.name !== 'exit') {
    if (nextScene.name === 'lint') {
      nextScene = await lint(core);
    } else if (nextScene.name === 'selectRuleIds') {
      nextScene = await selectRuleIds(core, nextScene.args);
    } else if (nextScene.name === 'selectAction') {
      nextScene = await selectAction(core, nextScene.args);
    } else if (nextScene.name === 'selectToContinue') {
      nextScene = await selectToContinue();
    }
  }
}
