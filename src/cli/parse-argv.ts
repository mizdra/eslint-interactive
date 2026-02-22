import { parseArgs } from 'node:util';
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

/** Parse CLI options */
export function parseArgv(argv: string[]): ParsedCLIOptions {
  const options = {
    'config': { type: 'string', short: 'c' },
    'format': { type: 'string' },
    'quiet': { type: 'boolean' },
    'cache': { type: 'boolean' },
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
    console.log(
      `
eslint-interactive [...patterns]

Options:
      --help                   Show help
      --version                Show version number
  -c, --config <path>          Use this configuration, overriding config options if present
      --format <nameOrPath>    Specify the format to be used for the "Display problem messages" action
      --quiet                  Report errors only
      --cache                  Only check changed files
      --cache-location <path>  Path to the cache file or directory
      --flag <name>            Enable a feature flag (requires ESLint v9.6.0+)

Examples:
  eslint-interactive                          Lint all files in the project
  eslint-interactive src test                 Lint specified directories
  eslint-interactive 'src/**/*.{ts,tsx,vue}'  Lint with glob pattern
`.trim(),
    );
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
