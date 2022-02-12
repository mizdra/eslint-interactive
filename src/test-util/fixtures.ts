import { exec } from 'child_process';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';
import { promisify } from 'util';

const execPromise = promisify(exec);

const cwd = join(dirname(fileURLToPath(import.meta.url)), '..', '..');

/**
 * Returns a string containing the stitched together contents of the file modified by fix.
 * To make the snapshot easier to read, the name of the file is inserted at the beginning of the contents of each file.
 */
export async function getSnapshotOfChangedFiles(): Promise<string> {
  const { stdout } = await execPromise(`diff -qr fixtures fixtures-tmp | cut -d " " -f 4 | xargs tail -n +1`, {
    cwd,
  });
  return stdout.toString();
}

export async function setupFixturesCopy() {
  await execPromise(`rm -rf fixtures-tmp && cp -r fixtures fixtures-tmp`, { cwd });
}

export async function cleanupFixturesCopy() {
  await execPromise(`rm -rf fixtures-tmp`, { cwd });
}
