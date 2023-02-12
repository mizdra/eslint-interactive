import { join, dirname, resolve } from 'path';
import { runAllFixes } from './helper.js';
import { fileURLToPath } from 'url';
// import { Core } from '../dist/core.js';
import { createFixtures } from './helper.js';
import { Volume } from 'memfs';
import * as fs from 'fs';
import { patchFs } from 'fs-monkey';
import { ufs } from 'unionfs';

const vol = Volume.fromJSON();

const __dirname = join(dirname(fileURLToPath(import.meta.url)));

const deepLine = '{'.repeat(10) + '0' + '}'.repeat(10) + '\n';
const broadLine = '{' + ';'.repeat(10) + '0' + '}' + '\n';

// create fixtures in memory fs
await createFixtures(vol, join(__dirname, 'fixtures'), [
  { label: 'basic', source: '0\n' + '0;\n'.repeat(50), amount: 10 },
  {
    label: 'huge-ast',
    source: deepLine + broadLine,
    amount: 10,
  },
  {
    label: 'overlapped',
    source: '/* eslint arrow-body-style: [2, "always"] */\n' + ('() => ('.repeat(10) + '0' + ')'.repeat(10) + ';\n'),
    amount: 10,
  },
  { label: 'not-error-file', source: '0 == 1;\n', amount: 100 },
]);

// patch fs
ufs.use(vol).use({ ...fs });
patchFs(ufs);

// run fixing
const { Core } = await import('../dist/core.js');
const core = new Core({ patterns: [join(__dirname, 'fixtures')], cwd: __dirname });
await runAllFixes(core);
