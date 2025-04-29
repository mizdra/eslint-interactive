import { spawn } from 'node:child_process';

export async function pager(content: string): Promise<void> {
  if (process.platform === 'win32') {
    return spawnPager('more', [], content);
  } else {
    return spawnPager('less', ['-R'], content);
  }
}

async function spawnPager(command: string, options: string[], content: string): Promise<void> {
  return new Promise<void>((resolve, reject) => {
    try {
      const process = spawn(command, options, { shell: true, stdio: ['pipe', 'inherit', 'inherit'] });
      process.stdin.write(content);
      process.stdin.end();
      process.addListener('exit', (code) => {
        if (code !== 0) {
          reject(new Error(`\`${command}\` exited with code ${code}`));
        } else {
          resolve();
        }
      });
      process.addListener('error', (err) => {
        reject(new Error(`\`${command}\` throws an error: ${err.message}`));
      });
    } catch (e) {
      const cause = e instanceof Error ? e.message : String(e);
      reject(new Error(`Failed to execute \`${command}\`: ${cause}`));
    }
  });
}
