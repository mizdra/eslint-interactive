import assert from 'assert';
import { spawn } from 'child_process';

const ETX = String.fromCharCode(0x03); // ^C
const LF = String.fromCharCode(0x0a); // \n

async function wait(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function readStream(stream) {
  let result = '';
  for await (const line of stream) {
    result += line;
  }
  return result;
}

(async () => {
  const child = spawn(
    'eslint-interactive',
    [
      'failed.js',
      // merge stderr to stdout
      '2>&1',
    ],
    { shell: true, stdio: ['pipe', 'pipe', 'pipe'] },
  );

  await wait(500);
  child.stdin.write(' ');
  await wait(500);
  child.stdin.write(LF);
  await wait(500);
  child.stdin.write(LF);
  await wait(500);
  child.stdin.write('1');
  await wait(500);
  child.stdin.write(LF);
  await wait(500);
  child.stdin.write(ETX);

  const output = await readStream(child.stdout);
  console.log(output); // for debug

  assert(output.includes('error: Missing semicolon (semi) at failed.js:2:2:'));
})();
