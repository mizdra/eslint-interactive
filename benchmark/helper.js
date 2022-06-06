// @ts-check

import { mkdir, writeFile, rm, appendFile } from 'fs/promises';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';

const cwd = join(dirname(fileURLToPath(import.meta.url)));

/** @typedef {{ label: string, source: string, amount: number }} Case */
/** @typedef {{name: string, value: number, range?: string, unit: string, extra?: string; }} BenchmarkResult */

/**
 * @param {string} fixturesDirPath
 * @param {Case[]} cases
 */
export async function createFixtures(fixturesDirPath, cases) {
  // remove old fixtures
  await rm(fixturesDirPath, { recursive: true, force: true });

  // create fixtures directory
  await mkdir(fixturesDirPath, { recursive: true });

  // create fixtures
  /** @type {Promise<void>[]} */
  const promises = [];
  for (const c of cases) {
    for (let i = 0; i < c.amount; i++) {
      const promise = writeFile(join(fixturesDirPath, `${c.label}-${i + 1}.js`), c.source);
      promises.push(promise);
    }
  }
  await Promise.all(promises);
}
