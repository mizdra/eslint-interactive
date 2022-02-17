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
      return await core.applyAutoFixes(results, ['semi', 'arrow-body-style']);
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
      return await core.disablePerLine(results, ['semi', 'arrow-body-style']);
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
      return await core.disablePerFile(results, ['semi', 'arrow-body-style']);
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
      return await core.makeFixableAndFix(results, ['semi', 'arrow-body-style'], (message) => {
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
      return await core.applyAutoFixes(results, ['semi', 'arrow-body-style']);
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

  await createFixtures(join(cwd, 'fixtures'), [{ label: 'target', source: '0\n', amount: 1000 }]);
  await runBenchmarkForEachFix('fix-all-of-many-files', core);

  // huge AST
  const deepLine = '{'.repeat(100) + '0' + '}'.repeat(100) + '\n';
  const broadLine = '{' + ';'.repeat(100) + '0' + '}' + '\n';
  await createFixtures(join(cwd, 'fixtures'), [
    {
      label: 'target',
      source: (deepLine + broadLine).repeat(500),
      amount: 1,
    },
  ]);
  await runBenchmarkForEachFix('fix-all-of-huge-files', core);

  // overlapped
  await createFixtures(join(cwd, 'fixtures'), [
    {
      label: 'target',
      source:
        '/* eslint arrow-body-style: [2, "always"] */\n' +
        ('() => ('.repeat(10) + '0' + ')'.repeat(10) + ';\n').repeat(100),
      amount: 1,
    },
  ]);
  await runBenchmarkForEachFix('fix-overlapped-problems', core);
}

main();
