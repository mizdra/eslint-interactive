import { constants, cp, readFile } from 'node:fs/promises';
import { dirname, join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';
import dedent from 'dedent';
import { ESLint, Linter } from 'eslint';
import eslintPkg from 'eslint/use-at-your-own-risk';
import { resolve } from 'import-meta-resolve';
import { beforeEach, describe, expect, test, vi } from 'vitest';
import { Core } from './core.js';
import { createIFF } from './test-util/fixtures.js';

const { LegacyESLint } = eslintPkg;

const rootDir = join(dirname(fileURLToPath(import.meta.url)), '..');

// Normalize `message` for the snapshot.
function normalizeMessage(message: Linter.LintMessage) {
  return {
    ruleId: message.ruleId,
    severity: message.severity,
  } satisfies Partial<Linter.LintMessage>;
}

// Normalize `results` for the snapshot.
function normalizeResults(results: ESLint.LintResult[], fixtureDir: string) {
  return results.map((result) => {
    // Usually, `filePath` changes depending on the environment, and the snapshot will fail.
    // So, remove the current directory from `filePath`.
    const filePath = result.filePath
      .replace(fixtureDir, '<fixture>')
      .replace(relative(process.cwd(), fixtureDir), '<fixture>')
      // for windows
      .replace(/\\/gu, '/');
    return {
      filePath,
      errorCount: result.errorCount,
      warningCount: result.warningCount,
      messages: result.messages.map(normalizeMessage),
    };
  });
}

function countWarnings(results: ESLint.LintResult[]): number {
  return results.map((result) => result.warningCount).reduce((acc, num) => acc + num, 0);
}

const iff = await createIFF({
  'src/prefer-const.js': dedent`
    let a = 1;
  `,
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
  'src/import-order.js': dedent`
    import b from 'b';
    import a from 'a';
  `,
  'src/ban-exponentiation-operator.js': dedent`
    2 ** 2;
  `,
  'src/no-unused-vars.js': dedent`
    const a = 1;
  `,
  'src/warn.js': dedent`
    let a = 1;
  `,
  'src/no-unsafe-negation.js': dedent`
    if (!key in object) {}
  `,
  '.eslintrc.js': dedent`
    module.exports = {
      root: true,
      parserOptions: {
        ecmaVersion: 2021,
        sourceType: 'module',
      },
      overrides: [
        { files: ['prefer-const.js'], rules: { 'prefer-const': 'error' } },
        { files: ['arrow-body-style.js'], rules: { 'arrow-body-style': ['error', 'always'] } },
        { files: ['import-order.js'], rules: { 'import/order': 'error' } },
        { files: ['ban-exponentiation-operator.js'], rules: { 'ban-exponentiation-operator': 'error' } },
        {
          files: ['no-unused-vars.js'],
          rules: { 'no-unused-vars': ['error', { varsIgnorePattern: '^_' }] },
        },
        { files: ['warn.js'], rules: { 'prefer-const': 'warn' } },
        { files: ['no-unsafe-negation.js'], rules: { 'no-unsafe-negation': 'error' } },
      ],
    };
  `,
  'package.json': '{ "type": "commonjs" }',
  'rules': async (path) =>
    cp(join(rootDir, 'fixtures/rules'), path, { mode: constants.COPYFILE_FICLONE, recursive: true }),
});

const core = new Core({
  patterns: ['src'],
  // For some reason, the test fails if `formatterName === 'codeframe'`.
  // So here we overwrite it.
  formatterName: fileURLToPath(resolve('eslint-formatter-codeframe', import.meta.url)),
  cwd: iff.rootDir,
  eslintOptions: { type: 'eslintrc', rulePaths: ['rules'] },
});

beforeEach(async () => {
  await iff.reset();
});

describe('Core', () => {
  describe('constructor', () => {
    test('pass options to eslint', async () => {
      const iff = await createIFF({
        'src/index.js': 'let a = 1;',
        'src/index.mjs': '2 ** 2;',
        'rules': async (path) =>
          cp(join(rootDir, 'fixtures/rules'), path, { mode: constants.COPYFILE_FICLONE, recursive: true }),
        'package.json': '{ "type": "commonjs" }',
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
              ecmaVersion: 2021,
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
      expect(normalizeResults(results, iff.rootDir)).toMatchSnapshot();
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
  test('printSummaryOfResults', async () => {
    const results = await core.lint();
    vi.spyOn(LegacyESLint.prototype, 'getRulesMetaForResults').mockImplementationOnce(() => {
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
        .replaceAll(iff.rootDir, '<fixture>')
        .replaceAll(relative(process.cwd(), iff.rootDir), '<fixture>')
        // for windows
        .replace(/\\/gu, '/'),
    ).toMatchSnapshot();
  });
  describe('applyAutoFixes', () => {
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
    const original = await readFile(iff.paths['src/prefer-const.js'], 'utf-8');

    const undo = await core.disablePerLine(results, ['prefer-const']);

    expect(await readFile(iff.paths['src/prefer-const.js'], 'utf-8')).toMatchSnapshot();
    await undo();
    expect(await readFile(iff.paths['src/prefer-const.js'], 'utf-8')).toEqual(original);
  });
  test('disablePerFile', async () => {
    const results = await core.lint();
    const original = await readFile(iff.paths['src/prefer-const.js'], 'utf-8');

    const undo = await core.disablePerFile(results, ['prefer-const']);

    expect(await readFile(iff.paths['src/prefer-const.js'], 'utf-8')).toMatchSnapshot();
    await undo();
    expect(await readFile(iff.paths['src/prefer-const.js'], 'utf-8')).toEqual(original);
  });
  test('applySuggestions', async () => {
    const results = await core.lint();
    const original = await readFile(iff.paths['src/no-unsafe-negation.js'], 'utf-8');

    const undo = await core.applySuggestions(results, ['no-unsafe-negation'], (suggestions) => suggestions[0]);

    expect(await readFile(iff.paths['src/no-unsafe-negation.js'], 'utf-8')).toMatchSnapshot();
    await undo();
    expect(await readFile(iff.paths['src/no-unsafe-negation.js'], 'utf-8')).toEqual(original);
  });
  test('makeFixableAndFix', async () => {
    const results = await core.lint();
    const original = await readFile(iff.paths['src/no-unused-vars.js'], 'utf-8');

    const undo = await core.makeFixableAndFix(results, ['no-unused-vars'], (_message, node) => {
      if (!node || !node.range) return null;
      return { range: [node.range[0], node.range[0]], text: '_' };
    });

    expect(await readFile(iff.paths['src/no-unused-vars.js'], 'utf-8')).toMatchSnapshot();
    await undo();
    expect(await readFile(iff.paths['src/no-unused-vars.js'], 'utf-8')).toEqual(original);
  });
});
