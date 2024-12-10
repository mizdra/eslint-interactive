import { spawnSync } from 'node:child_process';
import { mkdir, appendFile, readFile, access } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { getCacheDir } from './cache.js';

const DEFAULT_EDITOR_COMMAND = 'vi';

function getEditorCommand(): string {
  return process.env['EDITOR'] ?? DEFAULT_EDITOR_COMMAND;
}

export async function editFileWithEditor(filepath: string): Promise<string> {
  const command = getEditorCommand();
  await mkdir(dirname(filepath), { recursive: true });
  await access(filepath).catch(async () => {
    await appendFile(filepath, '', 'utf8');
  });
  const { error } = spawnSync(command, [filepath], { stdio: 'inherit' });
  if (error) {
    throw error;
  }
  const newContent = await readFile(filepath, 'utf8');
  return newContent;
}

export function generateFilterScriptFilePath(ruleIds: string[]): string {
  const basename = `${ruleIds.join('_').replace(/[^\w-]/gu, '')}.js`;
  const filepath = join(getCacheDir(), 'filter-script', basename);
  return filepath;
}

export function generateFixableMakerScriptFilePath(ruleIds: string[]): string {
  const basename = `${ruleIds.join('_').replace(/[^\w-]/gu, '')}.js`;
  const filepath = join(getCacheDir(), 'fixable-maker-script', basename);
  return filepath;
}

export function generateExampleFilterScriptFilePath(): string {
  return join(dirname(fileURLToPath(import.meta.url)), '..', '..', 'static', 'example-filter-script.js');
}

export function generateExampleFixableMakerScriptFilePath(): string {
  return join(dirname(fileURLToPath(import.meta.url)), '..', '..', 'static', 'example-fixable-maker-script.js');
}
