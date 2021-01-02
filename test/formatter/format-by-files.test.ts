import { ESLint } from 'eslint';
import stripAnsi from 'strip-ansi';
import { formatByFiles } from '../../src/formatter/format-by-files';
import { fakeLintResult, fakeLintMessage } from '../util/eslint';

describe('formatByFiles', () => {
  test('outputs formatted text', () => {
    const results: ESLint.LintResult[] = [
      fakeLintResult({
        messages: [
          fakeLintMessage({ ruleId: 'rule-a', severity: 2 }),
          fakeLintMessage({ ruleId: 'rule-a', severity: 2 }),
          fakeLintMessage({ ruleId: 'rule-a', severity: 1 }),
        ],
        errorCount: 2,
        warningCount: 1,
      }),
      fakeLintResult({
        messages: [],
        errorCount: 0,
        warningCount: 0,
      }),
    ];
    expect(stripAnsi(formatByFiles(results))).toMatchInlineSnapshot(
      `"2 file(s) checked.  1 passed.  1 failed.  2 file(s)  1 file(s)."`,
    );
  });
});
