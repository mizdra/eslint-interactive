import { exec } from 'child_process';
import { join } from 'path';
import { promisify } from 'util';
import { ESLint } from 'eslint';
import { mockConsoleLog } from 'jest-mock-process';
import { Core } from '../src/core';

const execPromise = promisify(exec);

async function getSnapshotOfChangedFiles(): Promise<string> {
  const { stdout } = await execPromise(
    `git diff --relative=fixtures --name-only | awk '{print "fixtures/"$1}' | xargs tail -n +1`,
    { cwd: join(__dirname, '..') },
  );
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

afterEach(async () => {
  await execPromise(`git restore fixtures`, { cwd: join(__dirname, '..') });
});

describe('Core', () => {
  const core = new Core({
    patterns: ['fixtures'],
    rulePaths: ['fixtures/rules'],
    extensions: ['.js', '.jsx', '.mjs'],
    formatterName: 'codeframe',
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
    const snapshot = await getSnapshotOfChangedFiles();
    expect(snapshot).toMatchSnapshot();
  });
});
