import { afterEach, expect, test } from 'vitest';
import { createIFF } from '../../src/test-util/fixtures.js';
import dedent from 'dedent';
import { readFile } from 'fs/promises';
import { stripVTControlCharacters } from 'util';

const { Core, takeRuleStatistics } = await import('eslint-interactive');

const iff = await createIFF({
  'src/prefer-const.js': dedent`
    let a = 1;
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
      ],
    };
  `,
  'package.json': '{ "type": "commonjs" }',
});

afterEach(async () => {
  await iff.reset();
});

test('Programmable API', async () => {
  const core = new Core({
    patterns: ['src'],
    eslintOptions: {
      type: 'eslintrc',
    },
    cwd: iff.rootDir,
  });
  const results = await core.lint();

  expect(stripVTControlCharacters(core.formatResultSummary(results))).toMatchSnapshot();
  const statistics = takeRuleStatistics(results);
  expect(statistics).toMatchSnapshot();

  await core.applyAutoFixes(results, ['prefer-const']);
  expect(await readFile(iff.paths['src/prefer-const.js'], 'utf-8')).toMatchSnapshot();
});
