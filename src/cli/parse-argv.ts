import { parseArgs } from 'node:util';
import type { Config, SortField, SortOrder } from '../type.js';
import { VERSION } from './package.js';

const VALID_SORT_FIELDS: readonly SortField[] = ['rule', 'error', 'warning', 'fixable', 'suggestions'];
const VALID_SORT_ORDERS: readonly SortOrder[] = ['asc', 'desc'];

/** Parse CLI options */
export function parseArgv(argv: string[]): Config {
  const options = {
    'config': { type: 'string', short: 'c' },
    'format': { type: 'string' },
    'quiet': { type: 'boolean' },
    'cache': { type: 'boolean' },
    'cache-location': { type: 'string' },
    'version': { type: 'boolean' },
    'help': { type: 'boolean' },
    'flag': { type: 'string', multiple: true },
    'sort': { type: 'string' },
    'sort-order': { type: 'string' },
  } as const;

  const { values, positionals } = parseArgs({
    allowPositionals: true,
    allowNegative: true,
    strict: true,
    args: argv.slice(2),
    options,
  });

  // Validate `--sort` and `--sort-order`
  if (values.sort !== undefined && !VALID_SORT_FIELDS.includes(values.sort as SortField)) {
    console.error(`Invalid --sort value: "${values.sort}". Must be one of: ${VALID_SORT_FIELDS.join(', ')}`);
    // eslint-disable-next-line n/no-process-exit
    process.exit(1);
  }
  if (values['sort-order'] !== undefined && !VALID_SORT_ORDERS.includes(values['sort-order'] as SortOrder)) {
    console.error(
      `Invalid --sort-order value: "${values['sort-order']}". Must be one of: ${VALID_SORT_ORDERS.join(', ')}`,
    );
    // eslint-disable-next-line n/no-process-exit
    process.exit(1);
  }

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
      --sort <field>           Sort rules by: rule, error, warning, fixable, suggestions
      --sort-order <direction> Sort direction: asc, desc (default: desc for counts, asc for rule)

Examples:
  eslint-interactive                          Lint all files in the project
  eslint-interactive src test                 Lint specified directories
  eslint-interactive 'src/**/*.{ts,tsx,vue}'  Lint with glob pattern
  eslint-interactive --sort error             Sort rules by error count (descending)
  eslint-interactive --sort rule              Sort rules by rule name (ascending)
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
    sort: values.sort as SortField | undefined,
    sortOrder: values['sort-order'] as SortOrder | undefined,
  };
}
