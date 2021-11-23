import { RuleTester } from 'eslint';
import rule, { ApplySuggestionOption } from '../../src/rules/apply-suggestion';
import { fakeLintMessage, fakeLintResult, fakeSuggestion } from '../test-util/eslint';
import filterScriptArgumentExample from './filter-script-arguments-example.json';

const ruleTester = new RuleTester({ parserOptions: { ecmaVersion: 2020, ecmaFeatures: { jsx: true } } });

const TARGET_FILENAME = 'file.js';
const OTHER_FILENAME = 'other.js';

function validCase(args: { code: string[]; option: ApplySuggestionOption }): RuleTester.ValidTestCase {
  return {
    code: args.code.join('\n'),
    filename: TARGET_FILENAME,
    options: [args.option],
  };
}

function invalidCase(args: {
  code: string[];
  output: string[];
  option: ApplySuggestionOption;
}): RuleTester.InvalidTestCase {
  return {
    code: args.code.join('\n'),
    output: args.output.join('\n'),
    errors: [{ message: 'apply-suggestion' }],
    filename: TARGET_FILENAME,
    options: [args.option],
  };
}

ruleTester.run('apply-suggestion', rule, {
  valid: [
    // 他のルールの suggestion は無視される
    validCase({
      code: ['a = a + 1;'],
      option: {
        results: [
          fakeLintResult({
            filePath: TARGET_FILENAME,
            messages: [
              fakeLintMessage({
                ruleId: 'b',
                suggestions: [fakeSuggestion({ fix: { range: [0, 9], text: 'a += 1' } })],
              }),
            ],
          }),
        ],
        ruleIds: ['a'],
        filterScript: '(suggestions) => suggestions[0]',
      },
    }),
    // 他のファイルの suggestion は無視される
    validCase({
      code: ['b = b + 1;'],
      option: {
        results: [
          fakeLintResult({
            filePath: OTHER_FILENAME,
            messages: [
              fakeLintMessage({
                ruleId: 'a',
                suggestions: [fakeSuggestion({ fix: { range: [0, 9], text: 'b += 1' } })],
              }),
            ],
          }),
        ],
        ruleIds: ['a'],
        filterScript: '(suggestions) => suggestions[0]',
      },
    }),
    // suggestion がない場合は何もしない
    validCase({
      code: ['c = c + 1;'],
      option: {
        results: [
          fakeLintResult({
            filePath: TARGET_FILENAME,
            messages: [
              fakeLintMessage({
                ruleId: 'a',
              }),
              fakeLintMessage({
                ruleId: 'b',
                suggestions: [],
              }),
            ],
          }),
        ],
        ruleIds: ['a', 'b'],
        filterScript: '(suggestions) => suggestions[0]',
      },
    }),
    // filterScript から null もしくは undefined を返すと、suggestion は適用されない
    validCase({
      code: ['d = d + 1;'],
      option: {
        results: [
          fakeLintResult({
            filePath: TARGET_FILENAME,
            messages: [
              fakeLintMessage({
                ruleId: 'a',
                suggestions: [fakeSuggestion({ fix: { range: [0, 9], text: 'd += 1' } })],
              }),
            ],
          }),
        ],
        ruleIds: ['a'],
        filterScript: '(suggestions) => Math.random() < 0.5 ? null : undefined',
      },
    }),
    // filterScript から null もしくは undefined を返すと、suggestion は適用されない
    validCase({
      code: ['e = e + 1;'],
      option: {
        results: [
          fakeLintResult({
            filePath: TARGET_FILENAME,
            messages: [
              fakeLintMessage({
                ruleId: 'a',
                suggestions: [fakeSuggestion({ fix: { range: [0, 9], text: 'e += 1' } })],
              }),
            ],
          }),
        ],
        ruleIds: ['a'],
        filterScript: '(suggestions) => (Math.random() < 0.5 ? null : undefined)',
      },
    }),
  ],
  invalid: [
    // basic
    invalidCase({
      code: ['a = a + 1;'],
      output: ['a++;'],
      option: {
        results: [
          fakeLintResult({
            filePath: TARGET_FILENAME,
            messages: [
              fakeLintMessage({
                ruleId: 'a',
                suggestions: [
                  fakeSuggestion({ fix: { range: [0, 9], text: 'a += 1' } }),
                  fakeSuggestion({ fix: { range: [0, 9], text: 'a++' } }),
                  fakeSuggestion({ fix: { range: [0, 9], text: '++a' } }),
                ],
              }),
            ],
          }),
        ],
        ruleIds: ['a'],
        filterScript: '(suggestions) => suggestions[1]',
      },
    }),
    // 一度に複数の suggestion を適用できる
    invalidCase({
      code: ['b = b + 1;', 'b = b + 1;'],
      output: ['b += 1;', 'b++;'],
      option: {
        results: [
          fakeLintResult({
            filePath: TARGET_FILENAME,
            messages: [
              fakeLintMessage({
                ruleId: 'a',
                suggestions: [fakeSuggestion({ fix: { range: [0, 9], text: 'b += 1' } })],
              }),
              fakeLintMessage({
                ruleId: 'a',
                suggestions: [fakeSuggestion({ fix: { range: [11, 11 + 9], text: 'b++' } })],
              }),
            ],
          }),
        ],
        ruleIds: ['a'],
        filterScript: '(suggestions) => suggestions[0]',
      },
    }),
    // 一度に複数の rule の suggestion を適用できる
    invalidCase({
      code: ['c = c + 1;', 'c = c + 1;', 'c = c + 1;'],
      output: ['c += 1;', 'c++;', 'c = c + 1;'],
      option: {
        results: [
          fakeLintResult({
            filePath: TARGET_FILENAME,
            messages: [
              fakeLintMessage({
                ruleId: 'a',
                suggestions: [fakeSuggestion({ fix: { range: [0, 9], text: 'c += 1' } })],
              }),
              fakeLintMessage({
                ruleId: 'b',
                suggestions: [fakeSuggestion({ fix: { range: [11, 11 + 9], text: 'c++' } })],
              }),
              // `ruleIds` で指定されていない suggestion は適用されない
              fakeLintMessage({
                ruleId: 'c',
                suggestions: [fakeSuggestion({ fix: { range: [22, 22 + 9], text: '++c' } })],
              }),
            ],
          }),
        ],
        ruleIds: ['a', 'b'],
        filterScript: '(suggestions) => suggestions[0]',
      },
    }),
    // 1 つの行に複数の suggestion があっても全ての suggestion が適用できる
    invalidCase({
      code: ['d = d + 1; d = d + 1;'],
      output: ['d += 1; d++;'],
      option: {
        results: [
          fakeLintResult({
            filePath: TARGET_FILENAME,
            messages: [
              fakeLintMessage({
                ruleId: 'a',
                suggestions: [fakeSuggestion({ fix: { range: [0, 9], text: 'd += 1' } })],
              }),
              fakeLintMessage({
                ruleId: 'a',
                suggestions: [fakeSuggestion({ fix: { range: [11, 11 + 9], text: 'd++' } })],
              }),
            ],
          }),
        ],
        ruleIds: ['a'],
        filterScript: '(suggestions) => suggestions[0]',
      },
    }),
    // filterScript には message, result が渡ってくる
    invalidCase({
      code: ['e = e + 1;'],
      output: ["'" + JSON.stringify(filterScriptArgumentExample) + "';"],
      option: {
        results: [
          fakeLintResult({
            filePath: TARGET_FILENAME,
            messages: [
              fakeLintMessage({
                ruleId: 'a',
                suggestions: [fakeSuggestion({ fix: { range: [0, 9], text: 'e += 1' } })],
              }),
            ],
          }),
        ],
        ruleIds: ['a'],
        filterScript: `
        (suggestions, message, result) => {
          const suggestion = {
            desc: 'description',
            fix: {
              range: [0, 9],
              text: "'" + JSON.stringify({ suggestions, message, result }) + "'",
            },
          };
          return suggestion;
        };`,
      },
    }),
  ],
});
