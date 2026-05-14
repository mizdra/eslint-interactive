import { parseArgv } from '../cli/parse-argv.js';
import { Core } from '../core.js';
import type { NextScene } from '../scene/index.js';
import { checkResults, lint, selectAction, selectRuleIds } from '../scene/index.js';

export type Options = {
  argv: string[];
};

/** Run eslint-interactive. */
export async function run(options: Options) {
  const config = parseArgv(options.argv);
  const core = new Core(config);

  let nextScene: NextScene = { name: 'lint' };
  while (nextScene.name !== 'exit') {
    if (nextScene.name === 'lint') {
      // eslint-disable-next-line no-await-in-loop
      nextScene = await lint(core);
    } else if (nextScene.name === 'selectRuleIds') {
      // eslint-disable-next-line no-await-in-loop
      nextScene = await selectRuleIds(core, nextScene.args);
    } else if (nextScene.name === 'selectAction') {
      // eslint-disable-next-line no-await-in-loop
      nextScene = await selectAction(core, nextScene.args);
    } else if (nextScene.name === 'checkResults') {
      // eslint-disable-next-line no-await-in-loop
      nextScene = await checkResults(nextScene.args);
    }
  }
}
