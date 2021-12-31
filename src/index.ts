import { dirname, join } from 'path';
import { fileURLToPath } from 'url';
import { Worker } from 'worker_threads';
import { wrap } from 'comlink';
import nodeEndpoint from 'comlink/dist/esm/node-adapter.mjs';
// eslint-disable-next-line @typescript-eslint/no-require-imports
import isInstalledGlobally = require('is-installed-globally');
import { warn } from './cli/log.js';
import { parseArgv } from './cli/parse-argv.js';
import { SerializableCore } from './core-worker.js';
import { lint, selectAction, selectRuleIds, selectToContinue } from './scenes/index.js';
import { NextScene } from './types.js';

export type Options = {
  argv: string[];
};

/**
 * Run eslint-interactive.
 */
export async function run(options: Options) {
  if (isInstalledGlobally) {
    warn(
      'eslint-interactive is installed globally. ' +
        'The globally installed eslint-interactive is not officially supported because some features do not work. ' +
        'It is recommended to install eslint-interactive locally.',
    );
  }
  const config = parseArgv(options.argv);

  // Directly executing the Core API will hog the main thread and halt the spinner.
  // So we wrap it with comlink and run it on the Worker.
  const worker = new Worker(join(dirname(fileURLToPath(import.meta.url)), 'core-worker.js'));
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const ProxiedCore = wrap<typeof SerializableCore>((nodeEndpoint as any)(worker));
  const core = await new ProxiedCore(config);

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
