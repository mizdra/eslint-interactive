import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const PACKAGE_JSON = JSON.parse(
  readFileSync(join(dirname(fileURLToPath(import.meta.url)), '..', '..', 'package.json'), 'utf8'),
);

export const VERSION: string = PACKAGE_JSON.version;
