import { exec as execOriginal } from 'node:child_process';
import { access, appendFile, mkdir, readFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { promisify } from 'node:util';
import { getTempDir } from './file-system.js';

const exec = promisify(execOriginal);

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
  await exec(`${command} ${filepath}`);
  const newContent = await readFile(filepath, 'utf8');
  return newContent;
}

export function generateFilterScriptFilePath(ruleIds: string[]): string {
  const basename = `${ruleIds.join('_').replace(/[^\w-]/gu, '')}.js`;
  const filepath = join(getTempDir(), 'filter-script', basename);
  return filepath;
}

export function generateFixableMakerScriptFilePath(ruleIds: string[]): string {
  const basename = `${ruleIds.join('_').replace(/[^\w-]/gu, '')}.js`;
  const filepath = join(getTempDir(), 'fixable-maker-script', basename);
  return filepath;
}

export function generateExampleFilterScriptFilePath(): string {
  return join(dirname(fileURLToPath(import.meta.url)), '..', '..', 'static', 'example-filter-script.js');
}

export function generateExampleFixableMakerScriptFilePath(): string {
  return join(dirname(fileURLToPath(import.meta.url)), '..', '..', 'static', 'example-fixable-maker-script.js');
}
