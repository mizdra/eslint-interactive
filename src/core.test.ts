import { constants, cp, readFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import dedent from 'dedent';
import { ESLint, Linter } from 'eslint';
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';
import { Core } from './core.js';
import { cleanupFixturesCopy, createIFF, getSnapshotOfChangedFiles, setupFixturesCopy } from './test-util/fixtures.js';

const testIf = (condition: boolean) => (condition ? test : test.skip);

const rootDir = join(dirname(fileURLToPath(import.meta.url)), '..');
const cwd = rootDir;
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
function normalizeResults(results: ESLint.LintResult[], fixtureDir?: string) {
  return results.map((result) => {
    // Usually, `filePath` changes depending on the environment, and the snapshot will fail.
    // So, remove the current directory from `filePath`.
    let filePath = result.filePath
      .replace(process.cwd(), '')
      // for windows
      .replace(/\\/gu, '/');
    if (fixtureDir) filePath = filePath.replace(fixtureDir, '<fixture>');
    return {
      filePath,
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
  let core: Core;
  beforeEach(() => {
    core = new Core({
      patterns: ['fixtures-tmp'],
      formatterName,
      cwd,
      eslintOptions: {
        type: 'eslintrc',
        rulePaths: ['fixtures-tmp/rules'],
        extensions: ['.js', '.jsx', '.mjs'],
      },
    });
  });
  describe('constructor', () => {
    test('pass options to eslint', async () => {
      const iff = await createIFF({
        'src/index.js': 'let a = 1;',
        'src/index.mjs': '2 ** 2;',
        'rules': async (path) =>
          cp(join(rootDir, 'fixtures/rules'), path, { mode: constants.COPYFILE_FICLONE, recursive: true }),
      });
      const core = new Core({
        patterns: ['src'],
        cwd: iff.rootDir,
        eslintOptions: {
          type: 'eslintrc',
          useEslintrc: false,
          rulePaths: ['rules'],
          extensions: ['.js', '.mjs'],
          overrideConfig: {
            parserOptions: {
              ecmaVersion: 2022,
              sourceType: 'module',
            },
            rules: { 'prefer-const': 'error', 'ban-exponentiation-operator': 'error' },
          },
        },
      });
      const results = await core.lint();
      expect(normalizeResults(results, iff.rootDir)).toMatchSnapshot();
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
  });
  // This test fails because the documentation url format is not supported in eslint 7.x.x and 8.0.0. Therefore, ignore this test.
  testIf(!ESLint.version.startsWith('7.'))('printSummaryOfResults', async () => {
    const results = await core.lint();
    vi.spyOn(ESLint.prototype, 'getRulesMetaForResults').mockImplementationOnce(() => {
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
  describe('applyAutoFixes', async () => {
    const iff = await createIFF({
      'src/prefer-const.js': 'let a = 1;',
      'src/arrow-body-style.js': dedent`
        () => (
          () => (
            () => (
              () => (
                () => (
                  () => (
                    () => (
                      () => (
                        () => (
                          () => (
                            () => (
                              () => (
                                0
                              )
                            )
                          )
                        )
                      )
                    )
                  )
                )
              )
            )
          )
        );
      `,
      '.eslintrc.js': dedent`
        module.exports = {
          parserOptions: {
            ecmaVersion: 2022,
            sourceType: 'module',
          },
          rules: {
            'prefer-const': 'error',
            'arrow-body-style': ['error', 'always'],
          },
        };
      `,
    });
    const core = new Core({
      patterns: ['src'],
      cwd: iff.rootDir,
      eslintOptions: { type: 'eslintrc' },
    });
    test('basic', async () => {
      const results = await core.lint();
      const original = await readFile(iff.paths['src/prefer-const.js'], 'utf-8');
      const undo = await core.applyAutoFixes(results, ['prefer-const']);
      expect(await readFile(iff.paths['src/prefer-const.js'], 'utf-8')).toMatchSnapshot();
      await undo();
      expect(await readFile(iff.paths['src/prefer-const.js'], 'utf-8')).toEqual(original);
    });
    test('fix overlapped problems', async () => {
      // NOTE: It can fix up to 11 overlapping errors. This is due to a constraints imposed by ESLint to prevent infinite loops.
      // ref: https://github.com/eslint/eslint/blob/5d60812d440762dff72420714273c714c4c5d074/lib/linter/linter.js#L44
      const results = await core.lint();
      const original = await readFile(iff.paths['src/arrow-body-style.js'], 'utf-8');
      const undo = await core.applyAutoFixes(results, ['arrow-body-style']);
      expect(await readFile(iff.paths['src/arrow-body-style.js'], 'utf-8')).toMatchSnapshot();
      await undo();
      expect(await readFile(iff.paths['src/arrow-body-style.js'], 'utf-8')).toEqual(original);
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
});
