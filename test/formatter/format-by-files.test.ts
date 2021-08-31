import { ESLint } from 'eslint';
import stripAnsi from 'strip-ansi';
import { formatByFiles } from '../../src/formatter/format-by-files';
import { fakeLintResult, fakeLintMessage } from '../test-util/eslint';

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
    const formattedText = formatByFiles(results);
    expect(stripAnsi(formattedText)).toMatchInlineSnapshot(
      `"2 file(s) checked.  1 passed.  1 failed.  2 file(s)  1 file(s)."`,
    );
    expect(formattedText).toMatchInlineSnapshot(`"[1m2 file(s) checked.[22m  [1m1 passed.[22m  [1m1 failed.[22m  [31m[1m2 file(s)[22m[39m  [33m[1m1 file(s).[22m[39m"`);
  });
});
