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

/**
 * @param {BenchmarkResult} benchmarkResult
 */
export async function logBenchmarkResult(benchmarkResult) {
  await appendFile(join(cwd, 'result.jsonl'), `${JSON.stringify(benchmarkResult)}\n`);
}

/**
 * @template T
 * @template U
 * @typedef {{
 *   name: string,
 *   warmup?: number,
 *   repeat: number,
 *   loop: number,
 *   beforeEach?: () => Promise<T>,
 *   fn: (beforeResult: T) => Promise<U>,
 *   afterEach?: (fnResult: U) => Promise<void>,
 * }} RunBenchmarkArgs<T,U>
 * */

/**
 * @template T
 * @template U
 * @param {RunBenchmarkArgs<T, U>} args
 */
export async function runBenchmark(args) {
  const { name, warmup = 1, repeat, beforeEach, fn, afterEach } = args;

  for (let i = 1; i <= warmup; i++) {
    console.log(`Running "${args.name}" (warmup: ${i}/${warmup}, repeat: 0/${args.repeat})`);
    const beforeResult = beforeEach ? await beforeEach() : undefined;
    const fnResult = await fn(beforeResult);
    if (afterEach) await afterEach(fnResult);
  }
  const progressThreshold = Math.max(1, Math.trunc(args.repeat / 10));
  let sum = 0;
  for (let i = 1; i <= repeat; i++) {
    if (i % progressThreshold === 0) {
      console.log(`Running "${args.name}" (warmup: ${warmup}/${warmup}, repeat: ${i}/${args.repeat})`);
    }

    for (let j = 0; j < args.loop; j++) {
      const beforeResult = beforeEach ? await beforeEach() : undefined;
      const start = performance.now();
      const fnResult = await fn(beforeResult);
      const end = performance.now();
      sum += end - start;
      if (afterEach) await afterEach(fnResult);
    }
  }
  await logBenchmarkResult({
    name,
    value: sum / repeat,
    unit: 'ms',
  });
}
