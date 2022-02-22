import { dirname, join } from 'path';
import { fileURLToPath } from 'url';
import { Core, takeRuleStatistics } from 'eslint-interactive';
import stripAnsi from 'strip-ansi';
import { cleanupFixturesCopy, getSnapshotOfChangedFiles, setupFixturesCopy } from '../../src/test-util/fixtures.js';

beforeEach(async () => {
  await setupFixturesCopy();
});

afterEach(async () => {
  await cleanupFixturesCopy();
});

test('Programmable API', async () => {
  const core = new Core({
    patterns: ['fixtures-tmp'],
    cwd: join(dirname(fileURLToPath(import.meta.url)), '..', '..'),
  });
  const results = await core.lint();

  expect(stripAnsi(core.formatResultSummary(results))).toMatchSnapshot();
  const statistics = takeRuleStatistics(results);
  expect(statistics).toMatchSnapshot();

  await core.applyAutoFixes(results, ['semi']);
  expect(await getSnapshotOfChangedFiles()).toMatchSnapshot();
});
