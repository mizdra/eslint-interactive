import { dirname, join } from 'path';
import { fileURLToPath } from 'url';
import { ESLint, Linter } from 'eslint';
import { Core } from '../src/core.js';
import { cleanupFixturesCopy, getSnapshotOfChangedFiles, setupFixturesCopy } from './test-util/fixtures.js';

const cwd = join(dirname(fileURLToPath(import.meta.url)), '..');

// Normalize `message` for the snapshot.
function normalizeMessage(message: Linter.LintMessage): Linter.LintMessage {
  // Exclude field because of the different format of `fix` in prefer-const in ESLint v7.0.0
  if (message.ruleId === 'prefer-const') {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    delete (message as any).fix;
  }
  return message;
}

// Normalize `results` for the snapshot.
function normalizeResults(results: ESLint.LintResult[]): ESLint.LintResult[] {
  return results.map((result) => {
    delete result.source; // Remove the source because the snapshot will be large
    delete result.suppressedMessages; // Remove the suppressedMessages because this field is supported in eslint v8.8.0+
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    delete (result as any).fatalErrorCount; // Remove because this field is not supported in eslint v7.0.0
    return {
      ...result,
      // Usually, `filePath` changes depending on the environment, and the snapshot will fail.
      // So, remove the current directory from `filePath`.
      filePath: result.filePath.replace(process.cwd(), ''),
      messages: result.messages.map(normalizeMessage),
    };
  });
}

beforeEach(async () => {
  await setupFixturesCopy();
});

afterEach(async () => {
  await cleanupFixturesCopy();
});

describe('Core', () => {
  const core = new Core({
    patterns: ['fixtures-tmp'],
    rulePaths: ['fixtures-tmp/rules'],
    extensions: ['.js', '.jsx', '.mjs'],
    formatterName: 'codeframe',
    cwd,
  });
  test('lint', async () => {
    const results = await core.lint();
    expect(normalizeResults(results)).toMatchSnapshot();
  });
  test('printSummaryOfResults', async () => {
    const results = await core.lint();
    expect(core.formatResultSummary(results)).toMatchSnapshot();
  });
  test('printDetailsOfResults', async () => {
    const results = await core.lint();
    expect(await core.formatResultDetails(results, ['import/order', 'ban-exponentiation-operator'])).toMatchSnapshot();
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
