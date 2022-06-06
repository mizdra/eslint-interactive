import { bench, runBenchmarks } from 'https://deno.land/std@0.142.0/testing/bench.ts';
import { Core } from '../dist/core.js';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createFixtures } from './helper.js';

const cwd = join(dirname(fileURLToPath(import.meta.url)));
const core = new Core({ patterns: ['fixtures'], cwd });

export async function run() {
  await createFixtures(join(cwd, 'fixtures'), [
    { label: 'target', source: '0\n', amount: 1000 },
    { label: 'other', source: '0 == 1;\n', amount: 1000 },
  ]);
  bench({
    name: 'fix-a-few-of-many-files (applyAutoFixes)',
    async func(b) {
      const results = await core.lint();
      b.start();
      const undo = await core.applyAutoFixes(results, ['semi', 'arrow-body-style']);
      b.stop();
      await undo();
    },
  });

  return runBenchmarks();
}

run();
