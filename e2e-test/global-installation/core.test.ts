// t
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';
import { cleanupFixturesCopy, setupFixturesCopy } from '../../test/test-util/fixtures.js';

// @ts-expect-error
// eslint-disable-next-line @typescript-eslint/no-require-imports, @typescript-eslint/no-var-requires
const { Core } = require(join(process.env.NODE_ROOT_GLOBAL_PATH, '@mizdra/eslint-interactive'));

beforeEach(async () => {
  await setupFixturesCopy();
});

afterEach(async () => {
  await cleanupFixturesCopy();
});

test('Core', async () => {
  async function main() {
    const core = new Core({
      patterns: ['fixtures-tmp'],
      cwd: join(dirname(fileURLToPath(import.meta.url)), '..', '..'),
    });
    let results = await core.lint();
    core.formatResultSummary(results);
    await core.formatResultDetails(results, ['import/order', 'ban-exponentiation-operator']);

    await core.fix(['semi']);

    results = await core.lint();
    await core.disablePerLine(results, ['prefer-const']);

    return 'success';
  }
  await expect(main()).resolves.toEqual('success');
});
