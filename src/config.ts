import type { ESLint } from 'eslint';
import type { ParsedCLIOptions } from './cli/parse-argv.js';

/** The config of eslint-interactive */
export type Config = ESLint.Options & {
  patterns: string[];
  formatterName?: string | undefined;
  quiet?: boolean | undefined;
};

export function translateCLIOptions(options: ParsedCLIOptions): Config {
  return {
    patterns: options.patterns,
    formatterName: options.formatterName,
    quiet: options.quiet,
    overrideConfigFile: options.overrideConfigFile,
    cache: options.cache,
    cacheLocation: options.cacheLocation,
    flags: options.flags,
  };
}
