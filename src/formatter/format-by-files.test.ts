import { stripVTControlCharacters } from 'node:util';
import type { ESLint } from 'eslint';
import { describe, expect, test } from 'vitest';
import { fakeLintMessage, fakeLintResult } from '../test-util/eslint.js';
import { formatByFiles } from './format-by-files.js';

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
    expect(stripVTControlCharacters(formattedText)).toMatchInlineSnapshot(`
"- 2 files (1 file passed, 1 file failed) checked.
- 3 problems (2 errors, 1 warning) found."
`);
    expect(formattedText).toMatchInlineSnapshot(`
      "[1m- 2 files (1 file passed, [91m1 file failed[39m) checked.
      - 3 problems ([31m2 errors[39m, [33m1 warning[39m) found.[22m"
    `);
  });
});
