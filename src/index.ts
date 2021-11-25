import { parseArgv } from './cli/parse-argv';
import { ESLintDecorator } from './eslint-decorator';
import { selectAction } from './scenes/select-action';
import { selectRuleIds } from './scenes/select-rule-ids';
import { selectToContinue } from './scenes/select-to-continue';
import { showLintResults } from './scenes/show-lint-results';
import { NextScene } from './types';

export type Options = {
  argv: string[];
};

/**
 * Run eslint-interactive.
 */
export async function run(options: Options) {
  const config = parseArgv(options.argv);
  const eslint = new ESLintDecorator(config);

  let nextScene: NextScene = { name: 'showLintResults' };
  while (nextScene.name !== 'exit') {
    if (nextScene.name === 'showLintResults') {
      nextScene = await showLintResults(eslint);
    } else if (nextScene.name === 'selectRuleIds') {
      nextScene = await selectRuleIds(eslint, nextScene.args);
    } else if (nextScene.name === 'selectAction') {
      nextScene = await selectAction(eslint, nextScene.args);
    } else if (nextScene.name === 'selectToContinue') {
      nextScene = await selectToContinue();
    }
  }
}
