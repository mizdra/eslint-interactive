import { execSync, spawn } from 'child_process';
import { dirname } from 'path';
import stripAnsi from 'strip-ansi';
import { fileURLToPath } from 'url';
import { VERSION } from '../../src/cli/package.js';
import { ESLint } from 'eslint';

jest.setTimeout(10 * 1000);

const __dirname = dirname(fileURLToPath(import.meta.url));

const ETX = String.fromCharCode(0x03); // ^C
const LF = String.fromCharCode(0x0a); // \n

async function wait(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function readStream(stream: NodeJS.ReadableStream) {
  let result = '';
  for await (const line of stream) {
    result += line;
  }
  return result;
}

beforeAll(() => {
  process.stderr.write('🤖  Installing eslint globally...\n');
  execSync(`npm install -g eslint@${ESLint.version}`); // Install the same version globally that was installed locally
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
    { shell: true, stdio: ['pipe', 'pipe', 'pipe'], cwd: __dirname },
  );

  await wait(3000);
  child.stdin.write(' '); // Select `semi` rule
  await wait(1000);
  child.stdin.write(LF); // Confirm the choice
  await wait(1000);
  child.stdin.write(LF); // Select `Display details of lint results`
  await wait(1000);
  child.stdin.write('0'); // Focus on `Print in terminal`
  await wait(1000);
  child.stdin.write(LF); // Confirm the choice
  await wait(1000);
  child.stdin.write(ETX); // Exit

  const output = await readStream(child.stdout);

  expect(stripAnsi(output)).toEqual(expect.stringContaining('error: Missing semicolon (semi) at failed.js:2:2:'));
});
