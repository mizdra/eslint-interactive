import { exec } from 'child_process';
import { join } from 'path';
import { promisify } from 'util';
import { ESLint } from 'eslint';
import { mockConsoleLog } from 'jest-mock-process';
import { Core } from '../src/core';

const execPromise = promisify(exec);

async function getSnapshotOfChangedFiles(): Promise<string> {
  const { stdout } = await execPromise(`diff -qr fixtures fixtures-tmp | cut -d " " -f 4 | xargs tail -n +1`, {
    cwd: join(__dirname, '..'),
  });
  return stdout.toString();
}

// Normalize `results` for the snapshot.
function normalize(results: ESLint.LintResult[]): ESLint.LintResult[] {
  return results.map((result) => {
    delete result.source; // Remove the source because the snapshot will be large
    return {
      ...result,
      // Usually, `filePath` changes depending on the environment, and the snapshot will fail.
      // So, remove the current directory from `filePath`.
      filePath: result.filePath.replace(process.cwd(), ''),
    };
  });
}

beforeEach(async () => {
  await execPromise(`rm -rf fixtures-tmp && cp -r fixtures fixtures-tmp`, { cwd: join(__dirname, '..') });
});

afterEach(async () => {
  await execPromise(`rm -rf fixtures-tmp`, { cwd: join(__dirname, '..') });
});

describe('Core', () => {
  const core = new Core({
    patterns: ['fixtures-tmp'],
    rulePaths: ['fixtures-tmp/rules'],
    extensions: ['.js', '.jsx', '.mjs'],
    formatterName: 'codeframe',
    cwd: join(__dirname, '..'),
  });
  test('lint', async () => {
    const results = await core.lint();
    expect(normalize(results)).toMatchSnapshot();
  });
  test('printSummaryOfResults', async () => {
    const results = await core.lint();
    const mockStdout = mockConsoleLog();
    core.printSummaryOfResults(results);
    expect(mockStdout.mock.calls[0]).toMatchSnapshot();
    mockStdout.mockRestore();
  });
  test('printDetailsOfResults', async () => {
    const results = await core.lint();

    const mockStdout = mockConsoleLog();
    await core.printDetailsOfResults(results, ['import/order', 'ban-exponentiation-operator'], 'withoutPager');
    expect(mockStdout.mock.calls[0]).toMatchSnapshot();
    mockStdout.mockRestore();
  });
  test('fix', async () => {
    await core.fix(['semi']);
    expect(await getSnapshotOfChangedFiles()).toMatchSnapshot();
  });
  test('disablePerLine', async () => {
    const results = await core.lint();
    await core.disablePerLine(results, ['ban-exponentiation-operator']);
    expect(await getSnapshotOfChangedFiles()).toMatchSnapshot();
  });
  test('disablePerFile', async () => {
    const results = await core.lint();
    await core.disablePerFile(results, ['ban-exponentiation-operator']);
    expect(await getSnapshotOfChangedFiles()).toMatchSnapshot();
  });
  test('applySuggestions', async () => {
    const results = await core.lint();
    await core.applySuggestions(results, ['no-unsafe-negation'], (suggestions) => suggestions[0]);
    expect(await getSnapshotOfChangedFiles()).toMatchSnapshot();
  });
  test('makeFixableAndFix', async () => {
    const results = await core.lint();
    await core.makeFixableAndFix(results, ['no-unused-vars'], (_message, node) => {
      if (!node || !node.range) return null;
      return { range: [node.range[0], node.range[0]], text: '_' };
    });
    expect(await getSnapshotOfChangedFiles()).toMatchSnapshot();
  });
});
