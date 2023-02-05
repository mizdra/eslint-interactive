import { join, dirname } from 'path';
import { runBenchmarkForEachFix } from './helper.js';
import { fileURLToPath } from 'url';
import { Core } from '../dist/core.js';

const __dirname = join(dirname(fileURLToPath(import.meta.url)));

const core = new Core({ patterns: ['fixtures'], cwd: __dirname });
await runBenchmarkForEachFix(core);
