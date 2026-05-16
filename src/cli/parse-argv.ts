import { parseArgs } from 'node:util';
import type { Config, FilterCriterion, SortField, SortOrder } from '../type.js';
import { VERSION } from './package.js';

const VALID_SORT_FIELDS: readonly SortField[] = ['rule', 'error', 'warning', 'fixable', 'suggestions'];
const VALID_SORT_ORDERS: readonly SortOrder[] = ['asc', 'desc'];
const VALID_FILTER_CRITERIA: readonly FilterCriterion[] = ['fixable', 'has-suggestions'];

/** Parse CLI options */
export function parseArgv(argv: string[]): Config {
  const options = {
    'config': { type: 'string', short: 'c' },
    'format': { type: 'string' },
    'quiet': { type: 'boolean' },
    'ignore-pattern': { type: 'string', multiple: true },
    'ignore': { type: 'boolean' },
    'cache': { type: 'boolean' },
    'cache-location': { type: 'string' },
    'version': { type: 'boolean' },
    'help': { type: 'boolean' },
    'flag': { type: 'string', multiple: true },
    'sort': { type: 'string' },
    'sort-order': { type: 'string' },
    'filter': { type: 'string', multiple: true },
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
  if (values.filter !== undefined) {
    for (const filter of values.filter) {
      if (!VALID_FILTER_CRITERIA.includes(filter as FilterCriterion)) {
        console.error(`Invalid --filter value: "${filter}". Must be one of: ${VALID_FILTER_CRITERIA.join(', ')}`);
        // eslint-disable-next-line n/no-process-exit
        process.exit(1);
      }
    }
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
      --help                    Show help
      --version                 Show version number
  -c, --config <path>           Use this configuration, overriding config options if present
      --format <nameOrPath>     Specify the format to be used for the "Display problem messages" action
      --quiet                   Report errors only
      --ignore-pattern <string> Patterns of files to ignore
      --no-ignore               Disable use of ignore files and patterns
      --cache                   Only check changed files
      --cache-location <path>   Path to the cache file or directory
      --flag <name>             Enable a feature flag (requires ESLint v9.6.0+)
      --sort <field>            Sort rules by: rule, error, warning, fixable, suggestions
      --sort-order <direction>  Sort direction: asc, desc (default: desc for counts, asc for rule)
      --filter <criterion>      Show only rules matching the criterion: fixable, has-suggestions
                                (repeatable; multiple values are OR-ed)

Examples:
  eslint-interactive                          Lint all files in the project
  eslint-interactive src test                 Lint specified directories
  eslint-interactive 'src/**/*.{ts,tsx,vue}'  Lint with glob pattern
  eslint-interactive --sort error             Sort rules by error count (descending)
  eslint-interactive --sort rule              Sort rules by rule name (ascending)
  eslint-interactive --filter fixable         Show only rules that have fixable problems
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
    ignorePatterns: values['ignore-pattern'],
    ignore: values.ignore,
    overrideConfigFile: values.config,
    cache: values.cache,
    cacheLocation: values['cache-location'],
    flags: values.flag,
    sort: values.sort as SortField | undefined,
    sortOrder: values['sort-order'] as SortOrder | undefined,
    filters: values.filter as FilterCriterion[] | undefined,
  };
}
