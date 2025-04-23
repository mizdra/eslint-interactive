import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { Core } from '../dist/core.js';
import { runAllFixes } from './helper.js';

const __dirname = join(dirname(fileURLToPath(import.meta.url)));

const core = new Core({ patterns: ['fixtures'], cwd: __dirname, eslintOptions: { type: 'eslintrc' } });
await runAllFixes(core);
