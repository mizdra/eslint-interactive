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

  await wait(2000);
  child.stdin.write(' '); // Select `semi` rule
  await wait(500);
  child.stdin.write(LF); // Confirm the choice
  await wait(500);
  child.stdin.write(LF); // Select `Display details of lint results`
  await wait(500);
  child.stdin.write('0'); // Focus on `Print in terminal`
  await wait(500);
  child.stdin.write(LF); // Confirm the choice
  await wait(500);
  child.stdin.write(ETX); // Exit

  const output = await readStream(child.stdout);
  console.log(output); // for debug

  assert(output.includes('error: Missing semicolon (semi) at failed.js:2:2:'));
})();
