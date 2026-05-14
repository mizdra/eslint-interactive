// eslint-disable-next-line n/no-unsupported-features/node-builtins
import { stripVTControlCharacters, styleText } from 'node:util';
import { describe, expect, test } from 'vitest';
import { terminalLink } from '../util/terminal-link.js';
import { formatTable } from './format-table.js';

const headerRow = ['Rule', 'Error', 'Warning', 'is fixable', 'has suggestions'];

describe('formatTable', () => {
  test('throw when no rows provided', () => {
    expect(() => formatTable(headerRow, [])).toThrowErrorMatchingInlineSnapshot(
      `[Error: \`bodyRows\` must not be empty]`,
    );
  });
  test('format table', () => {
    expect(
      formatTable(headerRow, [
        ['rule-1', '1', '2', '3', '4'],
        ['rule-2', '10', '11', '12', '13'],
      ]),
    ).toMatchInlineSnapshot(`
      "╔════════╤═══════╤═════════╤════════════╤═════════════════╗
      ║ Rule   │ Error │ Warning │ is fixable │ has suggestions ║
      ╟────────┼───────┼─────────┼────────────┼─────────────────╢
      ║ rule-1 │ 1     │ 2       │ 3          │ 4               ║
      ╟────────┼───────┼─────────┼────────────┼─────────────────╢
      ║ rule-2 │ 10    │ 11      │ 12         │ 13              ║
      ╚════════╧═══════╧═════════╧════════════╧═════════════════╝
      "
    `);
  });
  test('resize column width to fit content', () => {
    expect(
      formatTable(headerRow, [
        ['rule-1', '1', '0', '0', '0'],
        ['rule-2', '100000', '0', '0', '0'],
      ]),
    ).toMatchInlineSnapshot(`
      "╔════════╤════════╤═════════╤════════════╤═════════════════╗
      ║ Rule   │ Error  │ Warning │ is fixable │ has suggestions ║
      ╟────────┼────────┼─────────┼────────────┼─────────────────╢
      ║ rule-1 │ 1      │ 0       │ 0          │ 0               ║
      ╟────────┼────────┼─────────┼────────────┼─────────────────╢
      ║ rule-2 │ 100000 │ 0       │ 0          │ 0               ║
      ╚════════╧════════╧═════════╧════════════╧═════════════════╝
      "
    `);
  });
  test('calclulate column width ignoring ANSI escape codes', () => {
    const result = formatTable(headerRow, [
      ['rule-1', '1', '0', '0', '0'],
      ['rule-2', styleText('red', '1'), '0', '0', '0'],
      [terminalLink('rule-3', 'https://example.com'), '1', '0', '0', '0'],
    ]);
    expect(result).toMatchInlineSnapshot(`
      "╔════════╤═══════╤═════════╤════════════╤═════════════════╗
      ║ Rule   │ Error │ Warning │ is fixable │ has suggestions ║
      ╟────────┼───────┼─────────┼────────────┼─────────────────╢
      ║ rule-1 │ 1     │ 0       │ 0          │ 0               ║
      ╟────────┼───────┼─────────┼────────────┼─────────────────╢
      ║ rule-2 │ [31m1[39m     │ 0       │ 0          │ 0               ║
      ╟────────┼───────┼─────────┼────────────┼─────────────────╢
      ║ ]8;;https://example.comrule-3]8;; │ 1     │ 0       │ 0          │ 0               ║
      ╚════════╧═══════╧═════════╧════════════╧═════════════════╝
      "
    `);
    expect(stripVTControlCharacters(result)).toMatchInlineSnapshot(`
      "╔════════╤═══════╤═════════╤════════════╤═════════════════╗
      ║ Rule   │ Error │ Warning │ is fixable │ has suggestions ║
      ╟────────┼───────┼─────────┼────────────┼─────────────────╢
      ║ rule-1 │ 1     │ 0       │ 0          │ 0               ║
      ╟────────┼───────┼─────────┼────────────┼─────────────────╢
      ║ rule-2 │ 1     │ 0       │ 0          │ 0               ║
      ╟────────┼───────┼─────────┼────────────┼─────────────────╢
      ║ rule-3 │ 1     │ 0       │ 0          │ 0               ║
      ╚════════╧═══════╧═════════╧════════════╧═════════════════╝
      "
    `);
  });
});
