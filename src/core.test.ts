import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { jest } from '@jest/globals';
import { ESLint, Linter } from 'eslint';
import { Core, DEFAULT_BASE_CONFIG } from './core.js';
import { cleanupFixturesCopy, getSnapshotOfChangedFiles, setupFixturesCopy } from './test-util/fixtures.js';

const cwd = join(dirname(fileURLToPath(import.meta.url)), '..');
// For some reason, the test fails if `formatterName === 'codeframe'`.
// So here we overwrite it with `formatterName === 'eslint-formatter-codeframe'`.
const formatterName = 'eslint-formatter-codeframe';

// Normalize `message` for the snapshot.
function normalizeMessage(message: Linter.LintMessage) {
  return {
    ruleId: message.ruleId,
    severity: message.severity,
  } satisfies Partial<Linter.LintMessage>;
}

// Normalize `results` for the snapshot.
function normalizeResults(results: ESLint.LintResult[]) {
  return results.map((result) => {
    return {
      // Usually, `filePath` changes depending on the environment, and the snapshot will fail.
      // So, remove the current directory from `filePath`.
      filePath: result.filePath
        .replace(process.cwd(), '')
        // for windows
        .replace(/\\/gu, '/'),
      errorCount: result.errorCount,
      warningCount: result.warningCount,
      fixableErrorCount: result.fixableErrorCount,
      fixableWarningCount: result.fixableWarningCount,
      messages: result.messages.map(normalizeMessage),
    };
  });
}

function countWarnings(results: ESLint.LintResult[]): number {
  return results.map((result) => result.warningCount).reduce((acc, num) => acc + num, 0);
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
    formatterName,
    cwd,
  });
  test('baseOptions', () => {
    const core1 = new Core({
      useEslintrc: false,
      overrideConfigFile: 'override-config-file.json',
      patterns: ['pattern-a', 'pattern-b'],
      rulePaths: ['rule-path-a', 'rule-path-b'],
      extensions: ['.js', '.jsx'],
      formatterName,
      cache: false,
      cacheLocation: '.eslintcache',
      cwd: '/tmp/cwd',
    });
    expect(core1.baseESLintOptions).toStrictEqual<ESLint.Options>({
      useEslintrc: false,
      overrideConfigFile: 'override-config-file.json',
      cache: false,
      cacheLocation: '.eslintcache',
      rulePaths: ['rule-path-a', 'rule-path-b'],
      extensions: ['.js', '.jsx'],
      cwd: '/tmp/cwd',
      resolvePluginsRelativeTo: undefined,
    });
    const core2 = new Core({
      patterns: ['pattern-a', 'pattern-b'],
    });
    expect(core2.baseESLintOptions).toStrictEqual<ESLint.Options>({
      useEslintrc: DEFAULT_BASE_CONFIG.useEslintrc,
      cache: DEFAULT_BASE_CONFIG.cache,
      cacheLocation: DEFAULT_BASE_CONFIG.cacheLocation,
      rulePaths: undefined,
      extensions: undefined,
      cwd: undefined,
      resolvePluginsRelativeTo: undefined,
    });
  });
  describe('lint', () => {
    test('returns lint results', async () => {
      const results = await core.lint();
      expect(normalizeResults(results)).toMatchSnapshot();
    });
    test('filters warnings with --quiet option', async () => {
      const coreWithoutQuiet = new Core({
        ...core.config,
        quiet: false,
      });
      const resultsWithoutQuiet = await coreWithoutQuiet.lint();
      expect(countWarnings(resultsWithoutQuiet)).not.toEqual(0);

      const coreWithQuiet = new Core({
        ...core.config,
        quiet: true,
      });
      const resultsWithQuiet = await coreWithQuiet.lint();
      expect(countWarnings(resultsWithQuiet)).toEqual(0);
    });
    test('ignores files with --ignore-path option', async () => {
      const coreWithoutIgnorePath = new Core({
        ...core.config,
      });
      const resultsWithoutIgnorePath = await coreWithoutIgnorePath.lint();
      expect(countWarnings(resultsWithoutIgnorePath)).not.toEqual(0);

      const coreWithIgnorePath = new Core({
        ...core.config,
        ignorePath: 'fixtures-tmp/.customignore',
      });
      const resultsWithIgnorePath = await coreWithIgnorePath.lint();
      expect(countWarnings(resultsWithIgnorePath)).toEqual(0);
    });
  });
  // This test fails because the documentation url format is not supported in eslint 7.x.x and 8.0.0. Therefore, ignore this test.
  test('printSummaryOfResults', async () => {
    const results = await core.lint();
    jest.spyOn(ESLint.prototype, 'getRulesMetaForResults').mockImplementationOnce(() => {
      return {
        'prefer-const': {
          docs: {
            url: 'https://example.com',
          },
        },
      };
    });
    expect(core.formatResultSummary(results)).toMatchSnapshot();
  });
  test('printDetailsOfResults', async () => {
    const results = await core.lint();
    expect(
      (await core.formatResultDetails(results, ['import/order', 'ban-exponentiation-operator']))
        // for windows
        .replace(/\\/gu, '/'),
    ).toMatchSnapshot();
  });
  describe('applyAutoFixes', () => {
    test('basic', async () => {
      const results = await core.lint();
      const undo = await core.applyAutoFixes(results, ['semi']);
      expect(await getSnapshotOfChangedFiles()).toMatchSnapshot();
      await undo();
      expect(await getSnapshotOfChangedFiles()).toMatchSnapshot();
    });
    test('fix overlapped problems', async () => {
      // NOTE: It can fix up to 11 overlapping errors. This is due to a constraints imposed by ESLint to prevent infinite loops.
      // ref: https://github.com/eslint/eslint/blob/5d60812d440762dff72420714273c714c4c5d074/lib/linter/linter.js#L44
      const results = await core.lint();
      const undo = await core.applyAutoFixes(results, ['arrow-body-style']);
      expect(await getSnapshotOfChangedFiles()).toMatchSnapshot();
      await undo();
      expect(await getSnapshotOfChangedFiles()).toMatchSnapshot();
    });
  });
  test('disablePerLine', async () => {
    const results = await core.lint();
    const undo = await core.disablePerLine(results, ['ban-exponentiation-operator']);
    expect(await getSnapshotOfChangedFiles()).toMatchSnapshot();
    await undo();
    expect(await getSnapshotOfChangedFiles()).toMatchSnapshot();
  });
  test('disablePerFile', async () => {
    const results = await core.lint();
    const undo = await core.disablePerFile(results, ['ban-exponentiation-operator']);
    expect(await getSnapshotOfChangedFiles()).toMatchSnapshot();
    await undo();
    expect(await getSnapshotOfChangedFiles()).toMatchSnapshot();
  });
  test('applySuggestions', async () => {
    const results = await core.lint();
    const undo = await core.applySuggestions(results, ['no-unsafe-negation'], (suggestions) => suggestions[0]);
    expect(await getSnapshotOfChangedFiles()).toMatchSnapshot();
    await undo();
    expect(await getSnapshotOfChangedFiles()).toMatchSnapshot();
  });
  describe('makeFixableAndFix', () => {
    test('basic', async () => {
      const results = await core.lint();
      const undo = await core.makeFixableAndFix(results, ['no-unused-vars'], (_message, node) => {
        if (!node || !node.range) return null;
        return { range: [node.range[0], node.range[0]], text: '_' };
      });
      expect(await getSnapshotOfChangedFiles()).toMatchSnapshot();
      await undo();
      expect(await getSnapshotOfChangedFiles()).toMatchSnapshot();
    });
    test('fix overlapped problems', async () => {
      // NOTE: eslint-interactive only fixes up to 11 overlapping errors to prevent infinite loops.
      // This follows the limitations of ESLint.
      // ref: https://github.com/eslint/eslint/blob/5d60812d440762dff72420714273c714c4c5d074/lib/linter/linter.js#L44
      const results = await core.lint();
      const undo = await core.makeFixableAndFix(results, ['arrow-body-style'], (message) => message.fix);
      expect(await getSnapshotOfChangedFiles()).toMatchSnapshot();
      await undo();
      expect(await getSnapshotOfChangedFiles()).toMatchSnapshot();
    });
  });
  describe('with overrideConfig', () => {
    test('returns lint results', async () => {
      const coreWithOverride = new Core({
        ...core.config,
        useEslintrc: false,
        overrideConfig: {
          root: true,
          env: {
            node: true,
            es2020: true,
          },
          parserOptions: {
            sourceType: 'module',
            ecmaVersion: 2020,
            ecmaFeatures: {
              jsx: true,
            },
          },
          rules: {
            semi: 'error',
          },
        },
      });
      const resultsWithOverride = await coreWithOverride.lint();
      expect(normalizeResults(resultsWithOverride)).toMatchSnapshot();
    });
  });
});
