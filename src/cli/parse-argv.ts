import { join, relative } from 'node:path';
import { parseArgs } from 'node:util';
import { getCacheDir } from '../util/cache.js';
import { DeepPartial } from '../util/type-check.js';
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
    'config': { type: 'string' },
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
  } as const;

  const { values, positionals } = parseArgs({
    allowPositionals: true,
    allowNegative: true,
    strict: true,
    args: argv.slice(2),
    options,
  });

  if (values.version) {
    console.log(`Version: ${VERSION}`);
    process.exit(0);
  }

  if (values.help) {
    console.log(`Usage: eslint [options] [file|dir|glob]`);
    console.log(`Options:`);
    console.log(`  --version           Show version number`);
    console.log(`  --help              Show help`);
    console.log(`  --eslintrc          Use configuration from .eslintrc`);
    console.log(`  --config            Use this configuration, overriding .eslintrc`);
    console.log(`  --ext               Specify JavaScript file extensions`);
    console.log(`  --resolve-plugins-relative-to  A folder where plugins should be resolved from`);
    console.log(`  --rulesdir          Use additional rules from this directory`);
    console.log(`  --ignore-path       Specify path of ignore file`);
    console.log(`  --format            Use a specific output format`);
    console.log(`  --quiet             Report errors only`);
    console.log(`  --cache             Only check changed files`);
    console.log(`  --cache-location    Path to the cache file or directory`);
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
  };
}
