import { stripVTControlCharacters } from 'node:util';
import type { ESLint } from 'eslint';
import { describe, expect, test } from 'vitest';
import { fakeFix, fakeLintMessage, fakeLintResult, fakeSuggestions } from '../test-util/eslint.js';
import { formatByRules } from './format-by-rules.js';

describe('formatByRules', () => {
  test('outputs formatted text', () => {
    const results: ESLint.LintResult[] = [
      fakeLintResult({
        messages: [
          fakeLintMessage({ ruleId: 'rule-a', severity: 2 }),
          fakeLintMessage({ ruleId: 'rule-a', severity: 2 }),
          fakeLintMessage({ ruleId: 'rule-a', severity: 2, fix: fakeFix() }),
          fakeLintMessage({ ruleId: 'rule-a', severity: 2, fix: fakeFix() }),
          fakeLintMessage({ ruleId: 'rule-a', severity: 2, suggestions: fakeSuggestions() }),
          fakeLintMessage({ ruleId: 'rule-a', severity: 2, suggestions: fakeSuggestions() }),
          fakeLintMessage({ ruleId: 'rule-a', severity: 2, suggestions: fakeSuggestions() }),
          fakeLintMessage({ ruleId: 'rule-a', severity: 2, suggestions: fakeSuggestions() }),
          fakeLintMessage({ ruleId: 'rule-a', severity: 1 }),
          fakeLintMessage({ ruleId: 'rule-a', severity: 1 }),
          fakeLintMessage({ ruleId: 'rule-a', severity: 1, fix: fakeFix() }),
          fakeLintMessage({ ruleId: 'rule-a', severity: 1, suggestions: fakeSuggestions() }),
          fakeLintMessage({ ruleId: 'rule-a', severity: 1, suggestions: fakeSuggestions() }),
          fakeLintMessage({ ruleId: 'rule-b', severity: 2 }),
        ],
      }),
    ];
    const formattedText = formatByRules(results);
    expect(stripVTControlCharacters(formattedText)).toMatchInlineSnapshot(`
      "╔════════╤═══════╤═════════╤════════════╤═════════════════╗
      ║ Rule   │ Error │ Warning │ is fixable │ has suggestions ║
      ╟────────┼───────┼─────────┼────────────┼─────────────────╢
      ║ rule-a │ 8     │ 5       │ 3          │ 6               ║
      ╟────────┼───────┼─────────┼────────────┼─────────────────╢
      ║ rule-b │ 1     │ 0       │ 0          │ 0               ║
      ╚════════╧═══════╧═════════╧════════════╧═════════════════╝
      "
    `);
    expect(formattedText).toMatchInlineSnapshot(`
      "╔════════╤═══════╤═════════╤════════════╤═════════════════╗
      ║ Rule   │ Error │ Warning │ is fixable │ has suggestions ║
      ╟────────┼───────┼─────────┼────────────┼─────────────────╢
      ║ rule-a │ [31m[1m8[22m[39m     │ [31m[1m5[22m[39m       │ [31m[1m3[22m[39m          │ [31m[1m6[22m[39m               ║
      ╟────────┼───────┼─────────┼────────────┼─────────────────╢
      ║ rule-b │ [31m[1m1[22m[39m     │ 0       │ 0          │ 0               ║
      ╚════════╧═══════╧═════════╧════════════╧═════════════════╝
      "
    `);
  });
  test('sorts rules when sortOptions is provided', () => {
    const results: ESLint.LintResult[] = [
      fakeLintResult({
        messages: [
          fakeLintMessage({ ruleId: 'rule-a', severity: 2 }),
          fakeLintMessage({ ruleId: 'rule-b', severity: 2 }),
          fakeLintMessage({ ruleId: 'rule-b', severity: 2 }),
        ],
      }),
    ];
    const formattedText = formatByRules(results, undefined, { sort: 'error' });
    const lines = stripVTControlCharacters(formattedText).split('\n');
    // rule-b (2 errors) should come before rule-a (1 error) when sorted by error desc
    const ruleAIndex = lines.findIndex((line) => line.includes('rule-a'));
    const ruleBIndex = lines.findIndex((line) => line.includes('rule-b'));
    expect(ruleBIndex).toBeLessThan(ruleAIndex);
  });
  test('filters rules when filters is provided', () => {
    const results: ESLint.LintResult[] = [
      fakeLintResult({
        messages: [
          fakeLintMessage({ ruleId: 'rule-fixable', severity: 2, fix: fakeFix() }),
          fakeLintMessage({ ruleId: 'rule-suggest', severity: 2, suggestions: fakeSuggestions() }),
          fakeLintMessage({ ruleId: 'rule-plain', severity: 2 }),
        ],
      }),
    ];
    const stripped = stripVTControlCharacters(formatByRules(results, undefined, { filters: ['fixable'] }));
    expect(stripped).toContain('rule-fixable');
    expect(stripped).not.toContain('rule-suggest');
    expect(stripped).not.toContain('rule-plain');
  });
  test('prints link', () => {
    const results: ESLint.LintResult[] = [
      fakeLintResult({
        messages: [
          fakeLintMessage({ ruleId: 'rule-a', severity: 2 }), // link is printed
          fakeLintMessage({ ruleId: 'rule-b', severity: 2 }), // no link is printed
          fakeLintMessage({ ruleId: 'plugin/rule-c', severity: 2 }), // link is printed
        ],
      }),
    ];
    const formattedText = formatByRules(results, {
      cwd: '/tmp',
      rulesMeta: {
        'rule-a': { docs: { url: 'https://example.com/rule-a' } },
        'plugin/rule-c': { docs: { url: 'https://example.com/plugin/rule-c' } },
      },
    });
    expect(stripVTControlCharacters(formattedText)).toMatchInlineSnapshot(`
      "╔═══════════════╤═══════╤═════════╤════════════╤═════════════════╗
      ║ Rule          │ Error │ Warning │ is fixable │ has suggestions ║
      ╟───────────────┼───────┼─────────┼────────────┼─────────────────╢
      ║ rule-a        │ 1     │ 0       │ 0          │ 0               ║
      ╟───────────────┼───────┼─────────┼────────────┼─────────────────╢
      ║ rule-b        │ 1     │ 0       │ 0          │ 0               ║
      ╟───────────────┼───────┼─────────┼────────────┼─────────────────╢
      ║ plugin/rule-c │ 1     │ 0       │ 0          │ 0               ║
      ╚═══════════════╧═══════╧═════════╧════════════╧═════════════════╝
      "
    `);
    expect(formattedText).toMatchInlineSnapshot(`
      "╔═══════════════╤═══════╤═════════╤════════════╤═════════════════╗
      ║ Rule          │ Error │ Warning │ is fixable │ has suggestions ║
      ╟───────────────┼───────┼─────────┼────────────┼─────────────────╢
      ║ ]8;;https://example.com/rule-arule-a]8;;        │ [31m[1m1[22m[39m     │ 0       │ 0          │ 0               ║
      ╟───────────────┼───────┼─────────┼────────────┼─────────────────╢
      ║ rule-b        │ [31m[1m1[22m[39m     │ 0       │ 0          │ 0               ║
      ╟───────────────┼───────┼─────────┼────────────┼─────────────────╢
      ║ ]8;;https://example.com/plugin/rule-cplugin/rule-c]8;; │ [31m[1m1[22m[39m     │ 0       │ 0          │ 0               ║
      ╚═══════════════╧═══════╧═════════╧════════════╧═════════════════╝
      "
    `);
  });
});
