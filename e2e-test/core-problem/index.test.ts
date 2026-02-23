import { afterEach, test, expect } from 'vitest';
import { createIFF } from '../../src/test-util/fixtures.js';
import dedent from 'dedent';
import { type ChildProcessWithoutNullStreams, spawn } from 'child_process';
import { createStreamWatcher } from '../../src/test-util/stream-watcher.js';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));

const iff = await createIFF({
  'src/invalid-syntax.js': dedent`
    invalid syntax code;
  `,
  'eslint.config.js': dedent`
    export default [
      { rules: { 'semi': 'error' } },
    ];
  `,
  'package.json': '{ "type": "module" }',
});

function waitForClose(child: ChildProcessWithoutNullStreams) {
  return new Promise<number | null>((resolve) => {
    if (child.exitCode !== null) resolve(child.exitCode);
    child.on('close', (exitCode) => resolve(exitCode));
  });
}

let child: ChildProcessWithoutNullStreams;
afterEach(async () => {
  child.kill();
  await waitForClose(child);
  await iff.reset();
});

test('report ESLint core problem details and exit with code 1', async () => {
  child = spawn(
    'node',
    [
      join(__dirname, '../../bin/eslint-interactive.js'),
      'src',
      // merge stderr to stdout
      '2>&1',
    ],
    { shell: true, stdio: 'pipe', cwd: iff.rootDir },
  );
  const streamWatcher = createStreamWatcher(child.stdout, { debug: false });

  const exitPromise = waitForClose(child);
  await streamWatcher.match(/ESLint Core Problems are found/);
  const exitCode = await exitPromise;
  expect(exitCode).toBe(1);
});
