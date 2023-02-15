// @ts-check

import { join, dirname } from 'path';
import { createFixtures } from './helper.js';
import { fileURLToPath } from 'url';
import { Volume } from 'memfs';
import { writeFile } from 'fs/promises';

const __dirname = join(dirname(fileURLToPath(import.meta.url)));

const vol = Volume.fromJSON({});

// create fixtures in in-memory fs
const deepLine = '{'.repeat(10) + '0' + '}'.repeat(10) + '\n';
const broadLine = '{' + ';'.repeat(10) + '0' + '}' + '\n';
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

// save fixtures data to json
const json = vol.toJSON();
await writeFile(join(__dirname, 'fixtures.json'), JSON.stringify(json));
