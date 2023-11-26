import { describe, expect, test } from 'vitest';
import { parseArgv } from './parse-argv.js';

const baseArgs = ['node', 'eslint-interactive'];

describe('parseArgv', () => {
  test('pattern', () => {
    expect(parseArgv([...baseArgs, 'foo']).patterns).toStrictEqual(['foo']);
    expect(parseArgv([...baseArgs, 'foo', 'bar']).patterns).toStrictEqual(['foo', 'bar']);
    expect(parseArgv([...baseArgs, '1', 'true']).patterns).toStrictEqual(['1', 'true']);
  });
  test('--no-eslintrc', () => {
    expect(parseArgv([...baseArgs, '--no-eslintrc']).eslintOptions).toEqual(
      expect.objectContaining({
        type: 'eslintrc',
        useEslintrc: false,
      }),
    );
    expect(parseArgv([...baseArgs, '--no-eslintrc=false']).eslintOptions).toEqual(
      expect.objectContaining({
        type: 'eslintrc',
        useEslintrc: true,
      }),
    );
  });
  test('--config', () => {
    expect(parseArgv([...baseArgs]).eslintOptions?.overrideConfigFile).toStrictEqual(undefined);
    expect(
      parseArgv([...baseArgs, '--config', 'override-config-file.json']).eslintOptions?.overrideConfigFile,
    ).toStrictEqual('override-config-file.json');
  });
  test('--rulesdir', () => {
    expect(parseArgv([...baseArgs, '--rulesdir', 'foo']).eslintOptions).toEqual(
      expect.objectContaining({
        type: 'eslintrc',
        rulePaths: ['foo'],
      }),
    );
    expect(parseArgv([...baseArgs, '--rulesdir', 'foo', '--rulesdir', 'bar']).eslintOptions).toEqual(
      expect.objectContaining({
        type: 'eslintrc',
        rulePaths: ['foo', 'bar'],
      }),
    );
    expect(parseArgv([...baseArgs, '--rulesdir', 'foo', 'bar']).eslintOptions).toEqual(
      expect.objectContaining({
        type: 'eslintrc',
        rulePaths: ['foo'],
      }),
    );
    expect(parseArgv([...baseArgs, '--rulesdir', '1', '--rulesdir', 'true']).eslintOptions).toEqual(
      expect.objectContaining({
        type: 'eslintrc',
        rulePaths: ['1', 'true'],
      }),
    );
  });
  test('--ignore-path', () => {
    expect(parseArgv([...baseArgs]).eslintOptions).toEqual(
      expect.objectContaining({
        type: 'eslintrc',
        ignorePath: undefined,
      }),
    );
    expect(parseArgv([...baseArgs, '--ignore-path', 'foo']).eslintOptions).toEqual(
      expect.objectContaining({
        type: 'eslintrc',
        ignorePath: 'foo',
      }),
    );
  });
  test('--ext', () => {
    expect(parseArgv([...baseArgs, '--ext', 'js']).eslintOptions).toEqual(
      expect.objectContaining({
        type: 'eslintrc',
        extensions: ['js'],
      }),
    );
    expect(parseArgv([...baseArgs, '--ext', 'js', '--ext', 'ts']).eslintOptions).toEqual(
      expect.objectContaining({
        type: 'eslintrc',
        extensions: ['js', 'ts'],
      }),
    );
    expect(parseArgv([...baseArgs, '--ext', 'js', 'ts']).eslintOptions).toEqual(
      expect.objectContaining({
        type: 'eslintrc',
        extensions: ['js'],
      }),
    );
    expect(parseArgv([...baseArgs, '--ext', 'js,ts,tsx']).eslintOptions).toEqual(
      expect.objectContaining({
        type: 'eslintrc',
        extensions: ['js', 'ts', 'tsx'],
      }),
    );
    expect(parseArgv([...baseArgs, '--ext', '1', '--ext', 'true']).eslintOptions).toEqual(
      expect.objectContaining({
        type: 'eslintrc',
        extensions: ['1', 'true'],
      }),
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
    expect(parseArgv([...baseArgs, '--cache']).eslintOptions?.cache).toBe(true);
    expect(parseArgv([...baseArgs, '--no-cache']).eslintOptions?.cache).toBe(false);
    expect(parseArgv([...baseArgs, '--cache', 'false']).eslintOptions?.cache).toBe(false);
  });
  test('--cache-location', () => {
    expect(parseArgv([...baseArgs, '--cache-location', '.eslintcache']).eslintOptions?.cacheLocation).toBe(
      '.eslintcache',
    );
  });
});
