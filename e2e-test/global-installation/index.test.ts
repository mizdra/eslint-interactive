import { beforeAll, expect, test } from 'vitest';
import { execSync, spawn } from 'child_process';
import { dirname } from 'path';
import { fileURLToPath } from 'url';
import { VERSION } from '../../src/cli/package.js';
import { createStreamWatcher } from '../../src/test-util/stream-watcher.js';
import { ESLint } from 'eslint';

const __dirname = dirname(fileURLToPath(import.meta.url));

const ETX = String.fromCharCode(0x03); // ^C
const LF = String.fromCharCode(0x0a); // \n

beforeAll(() => {
  process.stderr.write('🤖  Installing eslint globally...\n');
  execSync(`npm install -g eslint@${ESLint.version}`, { cwd: __dirname }); // Install the same version globally that was installed locally
  process.stderr.write('🤖 Packing eslint-interactive...\n');
  execSync('npm pack ../../', { cwd: __dirname });
  process.stderr.write('🤖  Installing eslint-interactive globally...\n');
  execSync(`npm install -g ./eslint-interactive-${VERSION}.tgz`, { cwd: __dirname });
  process.stderr.write('🤖  Successfully installed eslint-interactive globally!\n');
});

test('verify installation', async () => {
  const result = execSync('eslint-interactive --version', { cwd: __dirname });
  expect(result.toString().trim()).toBe(VERSION);
});

test('can print error with eslint-formatter-codeframe', async () => {
  const child = spawn(
    'eslint-interactive',
    [
      'failed.js',
      // merge stderr to stdout
      '2>&1',
    ],
    { shell: true, stdio: 'pipe', cwd: __dirname, env: { ...process.env, ESLINT_USE_FLAT_CONFIG: 'false' } },
  );
  const streamWatcher = createStreamWatcher(child.stdout, { debug: true });

  await streamWatcher.match(/Which rules would you like to apply action\?/);
  child.stdin.write(' '); // Select `semi` rule
  child.stdin.write(LF); // Confirm the choice
  await streamWatcher.match(/Which action do you want to do\?/);
  child.stdin.write(LF); // Select `Display details of lint results`
  await streamWatcher.match(/In what way are the details displayed\?/);
  child.stdin.write('0'); // Focus on `Print in terminal`
  child.stdin.write(LF); // Confirm the choice
  await streamWatcher.match(/Missing semicolon/); // formatted by eslint-formatter-codeframe
  child.stdin.write(ETX); // Exit
});
