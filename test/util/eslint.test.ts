import { ESLint } from 'eslint';
import { scanUsedPluginsFromResults } from '../../src/util/eslint';
import { fakeLintMessage, fakeLintResult } from '../test-util/eslint';

test('scanUsedPluginsFromResults', () => {
  const results: ESLint.LintResult[] = [
    fakeLintResult({
      messages: [
        fakeLintMessage({ ruleId: 'rule', severity: 2 }),
        fakeLintMessage({ ruleId: 'plugin/rule', severity: 2 }),
        fakeLintMessage({ ruleId: '@scoped/plugin/rule', severity: 2 }),
        fakeLintMessage({ ruleId: 'invalid/@scoped/plugin/rule', severity: 2 }),
      ],
    }),
  ];
  expect(scanUsedPluginsFromResults(results)).toStrictEqual(['plugin', '@scoped/plugin']);
});
