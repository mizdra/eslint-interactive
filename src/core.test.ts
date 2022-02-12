import { dirname, join } from 'path';
import { fileURLToPath } from 'url';
import { ESLint, Linter } from 'eslint';
import { Core, DEFAULT_BASE_CONFIG } from './core.js';
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
    return {
      ...result,
      // Usually, `filePath` changes depending on the environment, and the snapshot will fail.
      // So, remove the current directory from `filePath`.
      filePath: result.filePath.replace(process.cwd(), ''),
      messages: result.messages.map(normalizeMessage),
      // Remove the source because the snapshot will be large
      source: 'ommitted',
      // Remove the suppressedMessages because this field is supported in eslint v8.8.0+
      suppressedMessages: 'omitted',
      // Remove because this field is not supported in eslint v7.0.0
      fatalErrorCount: NaN,
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
  test('baseOptions', () => {
    const core1 = new Core({
      patterns: ['pattern-a', 'pattern-b'],
      rulePaths: ['rule-path-a', 'rule-path-b'],
      extensions: ['.js', '.jsx'],
      formatterName: 'codeframe',
      cache: false,
      cacheLocation: '.eslintcache',
      cwd: '/tmp/cwd',
    });
    expect(core1.baseOptions).toStrictEqual<ESLint.Options>({
      cache: false,
      cacheLocation: '.eslintcache',
      rulePaths: ['rule-path-a', 'rule-path-b'],
      extensions: ['.js', '.jsx'],
      cwd: '/tmp/cwd',
    });
    const core2 = new Core({
      patterns: ['pattern-a', 'pattern-b'],
    });
    expect(core2.baseOptions).toStrictEqual<ESLint.Options>({
      cache: DEFAULT_BASE_CONFIG.cache,
      cacheLocation: DEFAULT_BASE_CONFIG.cacheLocation,
      rulePaths: undefined,
      extensions: undefined,
      cwd: undefined,
    });
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
    const results = await core.lint();
    await core.fix(results, ['semi']);
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
  test('undoTransformation', async () => {
    const resultsForLint = await core.lint();
    const resultsForFix = await core.disablePerFile(resultsForLint, ['ban-exponentiation-operator']);
    expect(await getSnapshotOfChangedFiles()).toMatchSnapshot();
    await core.undoTransformation(resultsForFix);
    expect(await getSnapshotOfChangedFiles()).toMatchSnapshot();
  });
});
