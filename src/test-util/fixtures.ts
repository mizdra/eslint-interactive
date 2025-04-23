import { randomUUID } from 'node:crypto';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { defineIFFCreator } from '@mizdra/inline-fixture-files';

const rootDir = join(dirname(fileURLToPath(import.meta.url)), '..', '..');

const fixtureDir = join(rootDir, 'tmp/fixture', process.env['VITEST_POOL_ID']!);
export const createIFF = defineIFFCreator({ generateRootDir: () => join(fixtureDir, randomUUID()) });
