import { resolve } from 'path';
import { ESLint } from 'eslint';
import mock from 'mock-fs';
import { Core } from '../src/core';

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

beforeEach(() => {
  // After applying transform, we want to undo the changes, so we mock the filesystem.
  mock({
    fixtures: mock.load(resolve(__dirname, '../fixtures')),
    // NOTE: I don't know why, but node_modules won't work unless you mock them too.
    node_modules: mock.load(resolve(__dirname, '../node_modules')),
  });
});
afterEach(() => {
  mock.restore();
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
    // NOTE: Since snapshots cannot be saved when the file system is mocked, temporarily unmock it.
    mock.bypass(() => expect(normalize(results)).toMatchSnapshot());
  });
});
