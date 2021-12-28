const mockFormatByFiles = jest.fn(() => 'formatByFiles');
const mockFormatByRules = jest.fn(() => 'formatByRules');

import { ESLint } from 'eslint';
import { format } from '../../src/formatter.js';
import { fakeLintResult, fakeLintMessage } from '../test-util/eslint.js';

jest.mock('../../src/formatter/format-by-files', () => {
  return {
    ...jest.requireActual('../../src/formatter/format-by-files'),
    formatByFiles: mockFormatByFiles,
  };
});
jest.mock('../../src/formatter/format-by-rules', () => {
  return {
    ...jest.requireActual('../../src/formatter/format-by-rules'),
    formatByRules: mockFormatByRules,
  };
});

describe('format', () => {
  test('call `formatByFiles` and `formatByRules`', () => {
    const results: ESLint.LintResult[] = [
      fakeLintResult({
        messages: [fakeLintMessage({ ruleId: 'rule-a', severity: 2 })],
      }),
    ];
    const data: ESLint.LintResultData = { rulesMeta: {} };
    const formattedText = format(results, data);
    expect(formattedText).toMatchInlineSnapshot(`
"formatByFiles
formatByRules"
`);
    expect(mockFormatByFiles).toBeCalledWith(results);
    expect(mockFormatByRules).toBeCalledWith(results, data);
  });
});
