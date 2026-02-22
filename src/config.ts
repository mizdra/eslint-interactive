import type { ParsedCLIOptions } from './cli/parse-argv.js';
import type { Config } from './type.ts';

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
