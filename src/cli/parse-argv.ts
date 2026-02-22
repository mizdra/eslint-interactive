import { parseArgs } from 'node:util';
import type { DeepPartial } from '../util/type-check.js';
import { VERSION } from './package.js';

export type ParsedCLIOptions = {
  patterns: string[];
  formatterName: string | undefined;
  quiet: boolean | undefined;
  overrideConfigFile: string | undefined;
  cache: boolean | undefined;
  cacheLocation: string | undefined;
  flags: string[] | undefined;
};

/** Default CLI Options */
export const cliOptionsDefaults = {
  formatterName: 'stylish',
  quiet: false,
  cache: false,
} satisfies DeepPartial<ParsedCLIOptions>;

/** Parse CLI options */
export function parseArgv(argv: string[]): ParsedCLIOptions {
  const options = {
    'config': { type: 'string', short: 'c' },
    'format': { type: 'string', default: cliOptionsDefaults.formatterName },
    'quiet': { type: 'boolean', default: cliOptionsDefaults.quiet },
    'cache': { type: 'boolean', default: cliOptionsDefaults.cache },
    'cache-location': { type: 'string' },
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
      --help            Show help                                                                                    [boolean]
      --version         Show version number                                                                          [boolean]
  -c, --config          Use this configuration, overriding config options if present                                  [string]
      --format          Specify the format to be used for the "Display problem messages" action  [string] [default: "stylish"]
      --quiet           Report errors only                                                          [boolean] [default: false]
      --cache           Only check changed files                                                    [boolean] [default: false]
      --cache-location  Path to the cache file or directory                                                           [string]
      --flag            Enable a feature flag (requires ESLint v9.6.0+)                                                [array]

Examples:
  eslint-interactive ./src                      Lint ./src/ directory
  eslint-interactive ./src ./test               Lint multiple directories
  eslint-interactive './src/**/*.{ts,tsx,vue}'  Lint with glob pattern
      `);
    // eslint-disable-next-line n/no-process-exit
    process.exit(0);
  }

  const patterns = positionals.map((pattern) => pattern.toString());
  const formatterName = values.format;

  return {
    patterns,
    formatterName,
    quiet: values.quiet,
    overrideConfigFile: values.config,
    cache: values.cache,
    cacheLocation: values['cache-location'],
    flags: values.flag,
  };
}
