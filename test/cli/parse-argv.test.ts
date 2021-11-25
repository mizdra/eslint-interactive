import { parseArgv } from '../../src/cli/parse-argv';

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
});
