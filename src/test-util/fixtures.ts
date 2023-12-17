import { exec } from 'node:child_process';
import { randomUUID } from 'node:crypto';
import { rm } from 'node:fs/promises';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { promisify } from 'node:util';
import { defineIFFCreator } from '@mizdra/inline-fixture-files';
import fse from 'fs-extra/esm';

const execPromise = promisify(exec);

const rootDir = join(dirname(fileURLToPath(import.meta.url)), '..', '..');

// eslint-disable-next-line @typescript-eslint/no-non-null-assertion
export const fixtureDir = join(rootDir, 'tmp/fixture', process.env['VITEST_POOL_ID']!);
export const createIFF = defineIFFCreator({ generateRootDir: () => join(fixtureDir, randomUUID()) });

/**
 * Returns a string containing the stitched together contents of the file modified by fix.
 * To make the snapshot easier to read, the name of the file is inserted at the beginning of the contents of each file.
 */
export async function getSnapshotOfChangedFiles(): Promise<string> {
  const { stdout } = await execPromise(`diff -qr fixtures fixtures-tmp | cut -d " " -f 4 | xargs tail -n +1`, {
    cwd: rootDir,
  });
  return stdout.toString();
}

export async function setupFixturesCopy() {
  await rm(resolve(rootDir, 'fixtures-tmp'), { recursive: true, force: true });
  await fse.copy(resolve(rootDir, 'fixtures'), resolve(rootDir, 'fixtures-tmp'));
}

export async function cleanupFixturesCopy() {
  await rm(resolve(rootDir, 'fixtures-tmp'), { recursive: true, force: true });
}
