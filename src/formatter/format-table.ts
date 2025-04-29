import { stripVTControlCharacters } from 'node:util';

const CELL_PADDING_LEFT = 1;
const CELL_PADDING_RIGHT = 1;

type Row = string[];

export function formatTable(headerRow: Row, bodyRows: Row[]): string {
  if (bodyRows.length === 0) {
    throw new Error('`bodyRows` must not be empty');
  }
  const columnCount = headerRow.length;
  const columnWidths: number[] = Array(columnCount).fill(0);
  for (const row of [headerRow, ...bodyRows]) {
    for (let i = 0; i < columnCount; i++) {
      columnWidths[i] = Math.max(
        columnWidths[i]!,
        stripVTControlCharacters(row[i]!).length + CELL_PADDING_LEFT + CELL_PADDING_RIGHT,
      );
    }
  }

  let result = '';
  result += formatBorderLine(columnWidths, 'top') + '\n';
  result += formatRow(headerRow, columnWidths) + '\n';
  result += formatBorderLine(columnWidths, 'middle') + '\n';
  for (let i = 0; i < bodyRows.length; i++) {
    result += formatRow(bodyRows[i]!, columnWidths) + '\n';
    if (i < bodyRows.length - 1) {
      result += formatBorderLine(columnWidths, 'middle') + '\n';
    }
  }
  result += formatBorderLine(columnWidths, 'bottom') + '\n';
  return result;
}

function formatBorderLine(columnWidths: number[], type: 'top' | 'middle' | 'bottom'): string {
  let result = '';
  result +=
    type === 'top' ? '╔'
    : type === 'middle' ? '╟'
    : '╚';
  for (let j = 0; j < columnWidths.length; j++) {
    result += (type === 'middle' ? '─' : '═').repeat(columnWidths[j]!);
    if (j < columnWidths.length - 1) {
      result +=
        type === 'top' ? '╤'
        : type === 'middle' ? '┼'
        : '╧';
    }
  }
  result +=
    type === 'top' ? '╗'
    : type === 'middle' ? '╢'
    : '╝';
  return result;
}

function formatRow(row: string[], columnWidths: number[]): string {
  let result = '';
  result += '║';
  for (let j = 0; j < columnWidths.length; j++) {
    const cell = ' '.repeat(CELL_PADDING_LEFT) + row[j] + ' '.repeat(CELL_PADDING_RIGHT);
    result += cell + ' '.repeat(columnWidths[j]! - stripVTControlCharacters(cell).length);
    if (j < columnWidths.length - 1) {
      result += '│';
    }
  }
  result += '║';
  return result;
}
