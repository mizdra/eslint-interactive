import { afterEach, test, expect } from 'vitest';
import { createIFF } from '../../src/test-util/fixtures.js';
import dedent from 'dedent';
import { ChildProcessWithoutNullStreams, spawn } from 'child_process';
import { createStreamWatcher } from '../../src/test-util/stream-watcher.js';
import { readFile } from 'node:fs/promises';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));

const ETX = String.fromCharCode(0x03); // ^C
const LF = String.fromCharCode(0x0a); // \n

const iff = await createIFF({
  'src/index.js': 'let a = 1;',
  'eslint.config.js': dedent`
    export default [
      { rules: { 'prefer-const': 'error' } },
    ];
  `,
  'package.json': '{ "type": "module" }',
});

function waitForClose(child: ChildProcessWithoutNullStreams) {
  return new Promise<void>((resolve) => {
    child.on('close', resolve);
  });
}

let child: ChildProcessWithoutNullStreams;
afterEach(async () => {
  child.kill();
  await waitForClose(child);
  await iff.reset();
});

test('fix problems with flat config', async () => {
  child = spawn(
    'node',
    [
      join(__dirname, '../../bin/eslint-interactive.js'),
      'src',
      // merge stderr to stdout
      '2>&1',
    ],
    { shell: true, stdio: 'pipe', cwd: iff.rootDir, env: { ...process.env, ESLINT_USE_FLAT_CONFIG: 'true' } },
  );
  const streamWatcher = createStreamWatcher(child.stdout, { debug: true });

  await streamWatcher.match(/Which rules would you like to apply action\?/);
  child.stdin.write(' '); // Select `prefer-const` rule
  child.stdin.write(LF); // Confirm the choice
  await streamWatcher.match(/Which action do you want to do\?/);
  child.stdin.write('1'); // Focus on `Run `eslint --fix``
  child.stdin.write(LF); // Confirm the choice
  await streamWatcher.match(/Fixing done\./);
  expect(await readFile(iff.paths['src/index.js'], 'utf-8')).toMatchSnapshot();
  child.stdin.write(ETX); // Exit
});
