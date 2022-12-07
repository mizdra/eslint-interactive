import { parseArgv } from './parse-argv.js';

const baseArgs = ['node', 'eslint-interactive'];

describe('parseArgv', () => {
  test('pattern', () => {
    expect(parseArgv([...baseArgs, 'foo']).patterns).toStrictEqual(['foo']);
    expect(parseArgv([...baseArgs, 'foo', 'bar']).patterns).toStrictEqual(['foo', 'bar']);
    expect(parseArgv([...baseArgs, '1', 'true']).patterns).toStrictEqual(['1', 'true']);
  });
  test('--rulesdir', () => {
    expect(parseArgv([...baseArgs, '--rulesdir', 'foo']).rulePaths).toStrictEqual(['foo']);
    expect(parseArgv([...baseArgs, '--rulesdir', 'foo', '--rulesdir', 'bar']).rulePaths).toStrictEqual(['foo', 'bar']);
    expect(parseArgv([...baseArgs, '--rulesdir', 'foo', 'bar']).rulePaths).toStrictEqual(['foo']);
    expect(parseArgv([...baseArgs, '--rulesdir', '1', '--rulesdir', 'true']).rulePaths).toStrictEqual(['1', 'true']);
  });
  test('--ignore-path', () => {
    expect(parseArgv([...baseArgs]).ignorePath).toStrictEqual(undefined);
    expect(parseArgv([...baseArgs, '--ignore-path', 'foo']).ignorePath).toStrictEqual('foo');
  });
  test('--ext', () => {
    expect(parseArgv([...baseArgs, '--ext', 'js']).extensions).toStrictEqual(['js']);
    expect(parseArgv([...baseArgs, '--ext', 'js', '--ext', 'ts']).extensions).toStrictEqual(['js', 'ts']);
    expect(parseArgv([...baseArgs, '--ext', 'js', 'ts']).extensions).toStrictEqual(['js']);
    expect(parseArgv([...baseArgs, '--ext', 'js,ts,tsx']).extensions).toStrictEqual(['js', 'ts', 'tsx']);
    expect(parseArgv([...baseArgs, '--ext', '1', '--ext', 'true']).extensions).toStrictEqual(['1', 'true']);
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
    expect(parseArgv([...baseArgs, '--cache', 'false']).cache).toBe(false);
  });
  test('--cache-location', () => {
    expect(parseArgv([...baseArgs, '--cache-location', '.eslintcache']).cacheLocation).toBe('.eslintcache');
  });
});
