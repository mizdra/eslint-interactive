import { describe, expect, test } from 'vitest';
import { parseArgv } from './parse-argv.js';

const baseArgs = ['node', 'eslint-interactive'];

describe('parseArgv', () => {
  test('pattern', () => {
    expect(parseArgv([...baseArgs, 'foo']).patterns).toStrictEqual(['foo']);
    expect(parseArgv([...baseArgs, 'foo', 'bar']).patterns).toStrictEqual(['foo', 'bar']);
    expect(parseArgv([...baseArgs, '1', 'true']).patterns).toStrictEqual(['1', 'true']);
  });
  test('--config', () => {
    expect(parseArgv([...baseArgs]).overrideConfigFile).toStrictEqual(undefined);
    expect(parseArgv([...baseArgs, '--config', 'override-config-file.json']).overrideConfigFile).toStrictEqual(
      'override-config-file.json',
    );
    expect(parseArgv([...baseArgs, '-c', 'override-config-file.json']).overrideConfigFile).toStrictEqual(
      'override-config-file.json',
    );
  });
  test('--format', () => {
    expect(parseArgv([...baseArgs, '--format', 'foo']).formatterName).toBe('foo');
    expect(parseArgv([...baseArgs, '--format', '1']).formatterName).toBe('1');
  });
  test('--quiet', () => {
    expect(parseArgv([...baseArgs, '--quiet']).quiet).toBe(true);
    expect(parseArgv([...baseArgs, '--no-quiet']).quiet).toBe(false);
  });
  test('--cache', () => {
    expect(parseArgv([...baseArgs, '--cache']).cache).toBe(true);
    expect(parseArgv([...baseArgs, '--no-cache']).cache).toBe(false);
  });
  test('--cache-location', () => {
    expect(parseArgv([...baseArgs, '--cache-location', '.eslintcache']).cacheLocation).toBe('.eslintcache');
  });
  test('--flag', () => {
    expect(parseArgv([...baseArgs, '--flag', 'foo']).flags).toStrictEqual(['foo']);
    expect(parseArgv([...baseArgs, '--flag', 'foo', '--flag', 'bar']).flags).toStrictEqual(['foo', 'bar']);
    expect(parseArgv([...baseArgs, '--flag', 'foo', 'bar']).flags).toStrictEqual(['foo']);
    expect(parseArgv([...baseArgs, '--flag', '1', '--flag', 'true']).flags).toStrictEqual(['1', 'true']);
  });
});
