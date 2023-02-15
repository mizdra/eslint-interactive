// @ts-check

import { join, dirname } from 'path';
import { runAllFixes } from './helper.js';
import { fileURLToPath } from 'url';
import { Core } from '../dist/core.js';
import { Volume } from 'memfs';
import * as fs from 'fs';
import { patchFs } from 'fs-monkey';
import { ufs } from 'unionfs';
import { readFile } from 'fs/promises';

const __dirname = join(dirname(fileURLToPath(import.meta.url)));

// load fixtures data from json
const json = await readFile(join(__dirname, 'fixtures.json'), 'utf8');
const vol = Volume.fromJSON(JSON.parse(json));

// patch fs
ufs.use(/** @type any */ (vol)).use({ ...fs });
patchFs(ufs);

// run fixing
const core = new Core({ patterns: [join(__dirname, 'fixtures')], cwd: __dirname });
await runAllFixes(core);
