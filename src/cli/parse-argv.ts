import { join, relative } from 'node:path';
import { parseArgs } from 'node:util';
import { getCacheDir } from '../util/cache.js';
import type { DeepPartial } from '../util/type-check.js';
import { VERSION } from './package.js';

export type ParsedCLIOptions = {
  patterns: string[];
  formatterName: string | undefined;
  quiet: boolean | undefined;
  useEslintrc: boolean | undefined;
  overrideConfigFile: string | undefined;
  extensions: string[] | undefined;
  rulePaths: string[] | undefined;
  ignorePath: string | undefined;
  cache: boolean | undefined;
  cacheLocation: string | undefined;
  resolvePluginsRelativeTo: string | undefined;
  flags: string[] | undefined;
};

/** Default CLI Options */
export const cliOptionsDefaults = {
  formatterName: 'stylish',
  quiet: false,
  useEslintrc: true,
  cache: true,
  cacheLocation: relative(process.cwd(), join(getCacheDir(), '.eslintcache')),
} satisfies DeepPartial<ParsedCLIOptions>;

/** Parse CLI options */
export function parseArgv(argv: string[]): ParsedCLIOptions {
  const options = {
    'eslintrc': { type: 'boolean', default: cliOptionsDefaults.useEslintrc },
    'config': { type: 'string', short: 'c' },
    'ext': { type: 'string', multiple: true },
    'resolve-plugins-relative-to': { type: 'string' },
    'rulesdir': { type: 'string', multiple: true },
    'ignore-path': { type: 'string' },
    'format': { type: 'string', default: cliOptionsDefaults.formatterName },
    'quiet': { type: 'boolean', default: cliOptionsDefaults.quiet },
    'cache': { type: 'boolean', default: cliOptionsDefaults.cache },
    'cache-location': { type: 'string', default: cliOptionsDefaults.cacheLocation },
    'version': { type: 'boolean' },
    'help': { type: 'boolean' },
    'flag': { type: 'string', multiple: true },
  } as const;

  const { values, positionals } = parseArgs({
    allowPositionals: true,
    allowNegative: true,
    strict: true,
    args: argv.slice(2),
    options,
  });

  if (values.version) {
    console.log(VERSION);
    // eslint-disable-next-line n/no-process-exit
    process.exit(0);
  }

  if (values.help) {
    console.log(`
eslint-interactive [file.js] [dir]

Options:
      --help                         Show help                                                                                     [boolean]
      --version                      Show version number                                                                           [boolean]
      --eslintrc                     Enable use of configuration from .eslintrc.*                                  [boolean] [default: true]
  -c, --config                       Use this configuration, overriding .eslintrc.* config options if present                       [string]
      --resolve-plugins-relative-to  A folder where plugins should be resolved from, CWD by default                                 [string]
      --ext                          Specify JavaScript file extensions                                                              [array]
      --rulesdir                     Use additional rules from this directory                                                        [array]
      --ignore-path                  Specify path of ignore file                                                                    [string]
      --format                       Specify the format to be used for the \`Display problem messages\` action [string] [default: "codeframe"]
      --quiet                        Report errors only                                                           [boolean] [default: false]
      --cache                        Only check changed files                                                      [boolean] [default: true]
      --cache-location               Path to the cache file or directory
      --flag                         ESLint experimental flags

Examples:
  eslint-interactive ./src                                           Lint ./src/ directory
  eslint-interactive ./src ./test                                    Lint multiple directories
  eslint-interactive './src/**/*.{ts,tsx,vue}'                       Lint with glob pattern
  eslint-interactive ./src --ext .ts,.tsx,.vue                       Lint with custom extensions
  eslint-interactive ./src --rulesdir ./rules                        Lint with custom rules
  eslint-interactive ./src --no-eslintrc --config ./.eslintrc.ci.js  Lint with custom config
      `);
    // eslint-disable-next-line n/no-process-exit
    process.exit(0);
  }

  const patterns = positionals.map((pattern) => pattern.toString());
  const rulePaths = values.rulesdir?.map((rulePath) => rulePath.toString());
  const extensions = values.ext?.map((extension) => extension.toString()).flatMap((extension) => extension.split(','));
  const formatterName = values.format;

  return {
    patterns,
    formatterName,
    quiet: values.quiet,
    useEslintrc: values.eslintrc,
    overrideConfigFile: values.config,
    extensions,
    rulePaths,
    ignorePath: values['ignore-path'],
    cache: values.cache,
    cacheLocation: values['cache-location'],
    resolvePluginsRelativeTo: values['resolve-plugins-relative-to'],
    flags: values.flag,
  };
}
