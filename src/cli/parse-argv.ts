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
  };
  const { values, positionals } = parseArgs({ args: argv.slice(2), options });

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
