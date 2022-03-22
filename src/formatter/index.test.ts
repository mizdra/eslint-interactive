import { ESLint } from 'eslint';
import { fakeLintResult, fakeLintMessage } from '../test-util/eslint.js';
import { format } from './index.js';

describe('format', () => {
  test('call `formatByFiles` and `formatByRules`', () => {
    const results: ESLint.LintResult[] = [
      fakeLintResult({
        messages: [fakeLintMessage({ ruleId: 'rule-a', severity: 2 })],
      }),
    ];
    const data: ESLint.LintResultData = { cwd: '/tmp', rulesMeta: {} };
    const formattedText = format(results, data);
    expect(formattedText).toMatchInlineSnapshot(`
      "[1m- 1 file (0 file passed, [91m1 file failed[39m) checked.[22m
      [1m[22m
      ╔════════╤═══════╤═════════╤════════════╤═════════════════╗
      ║ Rule   │ Error │ Warning │ is fixable │ has suggestions ║
      ╟────────┼───────┼─────────┼────────────┼─────────────────╢
      ║ rule-a │ [31m[1m1[39m[22m     │ 0       │ 0          │ 0               ║
      ╚════════╧═══════╧═════════╧════════════╧═════════════════╝
      "
    `);
  });
});
