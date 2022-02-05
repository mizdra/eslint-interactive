import { spawn } from 'child_process';

const ETX = String.fromCharCode(0x03); // ^C
const LF = String.fromCharCode(0x0a); // \n

async function wait(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

(async () => {
  const child = spawn('eslint-interactive', ['failed.js'], { stdio: ['pipe', process.stdout, process.stderr] });

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
})();
