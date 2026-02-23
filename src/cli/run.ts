import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { Worker } from 'node:worker_threads';
import { wrap } from 'comlink';
import nodeEndpoint from 'comlink/dist/esm/node-adapter.mjs';
import terminalLink from 'terminal-link';
import { parseArgv } from '../cli/parse-argv.js';
import type { SerializableCore } from '../core-worker.js';
import type { NextScene } from '../scene/index.js';
import { checkResults, lint, selectAction, selectRuleIds } from '../scene/index.js';

export type Options = {
  argv: string[];
};

/**
 * Run eslint-interactive.
 */
export async function run(options: Options) {
  const config = parseArgv(options.argv);

  // Directly executing the Core API will hog the main thread and halt the spinner.
  // So we wrap it with comlink and run it on the Worker.
  const worker = new Worker(join(dirname(fileURLToPath(import.meta.url)), '..', 'core-worker.js'), {
    env: {
      // In worker threads, stdin is recognized as noTTY. Therefore, `util.styleText` and `terminalLink` disable colors and links.
      // To work around this, we use environment variables to force colors and links to be enabled.
      // ref: https://github.com/nodejs/node/issues/26946
      FORCE_COLOR: process.stdin.isTTY ? '1' : '0',
      FORCE_HYPERLINK: terminalLink.isSupported ? '1' : '0',
      ...process.env,
    },
    // NOTE: Pass CLI options (--unhandled-rejections=strict, etc.) to the worker
    execArgv: process.execArgv,
  });
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const ProxiedCore = wrap<typeof SerializableCore>((nodeEndpoint as any)(worker));
  const core = await new ProxiedCore(config);

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
  await worker.terminate();
}
