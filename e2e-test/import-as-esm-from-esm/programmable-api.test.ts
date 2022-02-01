import { dirname, join } from 'path';
import { fileURLToPath } from 'url';
import { Core, takeRuleStatistics } from '@mizdra/eslint-interactive';
import stripAnsi from 'strip-ansi';
import { cleanupFixturesCopy, getSnapshotOfChangedFiles, setupFixturesCopy } from '../../test/test-util/fixtures.js';

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

  const sortedStatistics = statistics
    // Exclude non-fixable statistic
    .filter((statistic) => statistic.isFixableCount > 0)
    // Sort by descending order of fixable count
    .sort((a, b) => b.isFixableCount - a.isFixableCount);

  const ruleIds = sortedStatistics.map((statistic) => statistic.ruleId);

  const top3RuleIds = ruleIds.slice(0, 3);
  expect(top3RuleIds).toStrictEqual(['semi', 'prefer-const', 'import/order']);

  await core.fix(top3RuleIds);
  expect(await getSnapshotOfChangedFiles()).toMatchSnapshot();
});
