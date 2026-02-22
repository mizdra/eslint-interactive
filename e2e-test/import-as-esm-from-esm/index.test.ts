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
  'eslint.config.js': dedent`
    export default [
      {
        languageOptions: {
          ecmaVersion: 2021,
          sourceType: 'module',
        },
      },
      { files: ['**/prefer-const.js'], rules: { 'prefer-const': 'error' } },
    ];
  `,
  'package.json': '{ "type": "module" }',
});

afterEach(async () => {
  await iff.reset();
});

test('Programmable API', async () => {
  const core = new Core({
    patterns: ['src'],
    cwd: iff.rootDir,
  });
  const results = await core.lint();

  expect(stripVTControlCharacters(core.formatResultSummary(results))).toMatchSnapshot();
  const statistics = takeRuleStatistics(results);
  expect(statistics).toMatchSnapshot();

  await core.applyAutoFixes(results, ['prefer-const']);
  expect(await readFile(iff.paths['src/prefer-const.js'], 'utf-8')).toMatchSnapshot();
});
