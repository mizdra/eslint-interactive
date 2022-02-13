// @ts-check

import { dirname, join } from 'path';
import { fileURLToPath } from 'url';
import { Core } from '../dist/core.js';
import { createFixtures, runBenchmark } from './helper.js';

const DEFAULT_REPEAT = 5;

/**
 * @param {string} benchmarkName
 * @param {Core} core
 * @param {{ applyAutoFixes?: number, disablePerLine?: number, disablePerFile?: number, makeFixableAndFix?: number, undo?: number }} [loopSet]
 */
async function runBenchmarkForEachFix(benchmarkName, core, loopSet) {
  const results = await core.lint();
  loopSet = {
    applyAutoFixes: loopSet?.applyAutoFixes ?? 1,
    disablePerLine: loopSet?.disablePerLine ?? 1,
    disablePerFile: loopSet?.disablePerFile ?? 1,
    makeFixableAndFix: loopSet?.makeFixableAndFix ?? 1,
    undo: loopSet?.undo ?? 1,
  };

  await runBenchmark({
    name: `${benchmarkName} (applyAutoFixes, loop: ${loopSet.applyAutoFixes})`,
    repeat: DEFAULT_REPEAT,
    loop: loopSet.applyAutoFixes,
    fn: async () => {
      return await core.applyAutoFixes(results, ['semi']);
    },
    afterEach: async (undo) => {
      await undo();
    },
  });
  await runBenchmark({
    name: `${benchmarkName} (disablePerLine, loop: ${loopSet.disablePerLine})`,
    repeat: DEFAULT_REPEAT,
    loop: loopSet.disablePerLine,
    fn: async () => {
      return await core.disablePerLine(results, ['semi']);
    },
    afterEach: async (undo) => {
      await undo();
    },
  });
  await runBenchmark({
    name: `${benchmarkName} (disablePerFile, loop: ${loopSet.disablePerFile})`,
    repeat: DEFAULT_REPEAT,
    loop: loopSet.disablePerFile,
    fn: async () => {
      return await core.disablePerFile(results, ['semi']);
    },
    afterEach: async (undo) => {
      await undo();
    },
  });
  await runBenchmark({
    name: `${benchmarkName} (makeFixableAndFix, loop: ${loopSet.makeFixableAndFix})`,
    repeat: DEFAULT_REPEAT,
    loop: loopSet.makeFixableAndFix,
    fn: async () => {
      return await core.makeFixableAndFix(results, ['semi'], (message) => {
        return message.fix;
      });
    },
    afterEach: async (undo) => {
      await undo();
    },
  });
  await runBenchmark({
    name: `${benchmarkName} (undo, loop: ${loopSet.undo})`,
    repeat: DEFAULT_REPEAT,
    loop: loopSet.undo,
    beforeEach: async () => {
      return await core.applyAutoFixes(results, ['semi']);
    },
    fn: async (undo) => {
      return await undo();
    },
  });
}

async function main() {
  const cwd = join(dirname(fileURLToPath(import.meta.url)));
  const core = new Core({ patterns: ['fixtures'], cwd });

  await createFixtures(join(cwd, 'fixtures'), [
    { label: 'target', source: '0\n', amount: 1000 },
    { label: 'other', source: '0 == 1;\n', amount: 1000 },
  ]);
  await runBenchmarkForEachFix('fix-a-few-of-many-files', core);

  await createFixtures(join(cwd, 'fixtures'), [{ label: 'target', source: '0\n', amount: 2000 }]);
  await runBenchmarkForEachFix('fix-all-of-many-files', core);

  // huge AST
  const lineWithoutSemicolon = '('.repeat(511) + '0' + ')'.repeat(511) + '\n'; // 1KB
  const lineWithSemicolon = '('.repeat(511) + '0' + ')'.repeat(511) + ';\n'; // 1KB + 1B ~= 1KB
  await createFixtures(join(cwd, 'fixtures'), [
    {
      label: 'target',
      // 1023KB + 1KB = 1MB
      source: lineWithoutSemicolon.repeat(1024) + lineWithSemicolon,
      amount: 1,
    },
  ]);
  await runBenchmarkForEachFix('fix-all-of-huge-files', core, {
    applyAutoFixes: 100,
    disablePerLine: 1,
    disablePerFile: 1,
    makeFixableAndFix: 1,
    undo: 1000,
  });
}

main();
