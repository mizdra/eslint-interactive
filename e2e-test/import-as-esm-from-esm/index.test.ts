import { afterEach, beforeEach, expect, test } from 'vitest';
import { execSync } from 'child_process';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';
import stripAnsi from 'strip-ansi';
// eslint-disable-next-line no-restricted-imports
import { cleanupFixturesCopy, getSnapshotOfChangedFiles, setupFixturesCopy } from '../../src/test-util/fixtures.js';

const { Core, takeRuleStatistics } = await import('eslint-interactive');

beforeEach(async () => {
  await setupFixturesCopy();
});

afterEach(async () => {
  await cleanupFixturesCopy();
});

test('Programmable API', async () => {
  const core = new Core({
    patterns: ['fixtures-tmp'],
    eslintOptions: {
      type: 'legacy',
      cwd: join(dirname(fileURLToPath(import.meta.url)), '..', '..'),
    },
  });
  const results = await core.lint();

  expect(stripAnsi(core.formatResultSummary(results))).toMatchSnapshot();
  const statistics = takeRuleStatistics(results);
  expect(statistics).toMatchSnapshot();

  await core.applyAutoFixes(results, ['semi']);
  expect(await getSnapshotOfChangedFiles()).toMatchSnapshot();
});
