import { afterEach, beforeEach, describe, expect, test } from 'vitest';
import { terminalLink } from './terminal-link.js';

const ORIGINAL_ENV = { ...process.env };

beforeEach(() => {
  for (const key of Object.keys(process.env)) delete process.env[key];
  Object.assign(process.env, ORIGINAL_ENV);
});

afterEach(() => {
  for (const key of Object.keys(process.env)) delete process.env[key];
  Object.assign(process.env, ORIGINAL_ENV);
});

describe('terminalLink', () => {
  test('emits OSC 8 escape sequence when hyperlinks are supported', () => {
    process.env['FORCE_HYPERLINK'] = '1';
    expect(terminalLink('text', 'https://example.com')).toBe('\x1B]8;;https://example.com\x07text\x1B]8;;\x07');
  });

  test('returns plain text when hyperlinks are not supported', () => {
    process.env['FORCE_HYPERLINK'] = '0';
    expect(terminalLink('text', 'https://example.com')).toBe('text');
  });
});
