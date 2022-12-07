import yargs from 'yargs';
import { Config, DEFAULT_BASE_CONFIG } from '../core.js';
import { VERSION } from './package.js';

/** Parse argv into the config object of eslint-interactive */
export function parseArgv(argv: string[]): Config {
  const parsedArgv = yargs(argv.slice(2))
    .version(VERSION)
    .usage('$0 [file.js] [dir]')
    .option('rulesdir', {
      type: 'array',
      describe: 'Use additional rules from this directory',
    })
    .nargs('rulesdir', 1)
    .option('ext', {
      type: 'array',
      describe: 'Specify JavaScript file extensions',
    })
    // Following ESLint, --ignore-path accepts only one path. However, this limitation may be relaxed in the future.
    // ref: https://github.com/eslint/eslint/issues/9794
    .option('ignore-path', {
      type: 'string',
      describe: 'Specify path of ignore file',
    })
    .nargs('ext', 1)
    .option('format', {
      type: 'string',
      describe: 'Specify the format to be used for the `Display problem messages` action',
      default: DEFAULT_BASE_CONFIG.formatterName,
    })
    .option('quiet', {
      type: 'boolean',
      describe: 'Report errors only',
      default: DEFAULT_BASE_CONFIG.quiet,
    })
    .option('cache', {
      type: 'boolean',
      describe: 'Only check changed files',
      default: DEFAULT_BASE_CONFIG.cache,
    })
    .option('cache-location', {
      type: 'string',
      describe: `Path to the cache file or directory`,
      default: DEFAULT_BASE_CONFIG.cacheLocation,
    })
    .parseSync();
  // NOTE: convert `string` type because yargs convert `'10'` (`string` type) into `10` (`number` type)
  // and `lintFiles` only accepts `string[]`.
  const patterns = parsedArgv._.map((pattern) => pattern.toString());
  const rulePaths = parsedArgv.rulesdir?.map((rulePath) => rulePath.toString());
  const extensions = parsedArgv.ext
    ?.map((extension) => extension.toString())
    // map '.js,.ts' into ['.js', '.ts']
    .flatMap((extension) => extension.split(','));
  const formatterName = parsedArgv.format;
  return {
    patterns,
    rulePaths,
    ignorePath: parsedArgv.ignorePath,
    extensions,
    formatterName,
    quiet: parsedArgv.quiet,
    cache: parsedArgv.cache,
    cacheLocation: parsedArgv['cache-location'],
  };
}
