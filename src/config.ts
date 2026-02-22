import type { ESLint } from 'eslint';
import type { ParsedCLIOptions } from './cli/parse-argv.js';
import { cliOptionsDefaults } from './cli/parse-argv.js';
import type { DeepPartial } from './util/type-check.js';

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

/** Default config of `Core` */
export const configDefaults = {
  formatterName: cliOptionsDefaults.formatterName,
  quiet: cliOptionsDefaults.quiet,
  cwd: process.cwd(),
  overrideConfigFile: undefined,
  cache: cliOptionsDefaults.cache,
  cacheLocation: undefined,
  overrideConfig: undefined,
  flags: undefined,
} satisfies DeepPartial<Config>;

export type NormalizedConfig = ESLint.Options & {
  patterns: string[];
  formatterName: string;
  quiet: boolean;
  cwd: string;
};

export function normalizeConfig(config: Config): NormalizedConfig {
  const cwd = config.cwd ?? configDefaults.cwd;
  return {
    ...config,
    patterns: config.patterns,
    formatterName: config.formatterName ?? configDefaults.formatterName,
    quiet: config.quiet ?? configDefaults.quiet,
    cwd,
    overrideConfigFile: config.overrideConfigFile ?? configDefaults.overrideConfigFile,
    cache: config.cache ?? configDefaults.cache,
    cacheLocation: config.cacheLocation ?? configDefaults.cacheLocation,
    overrideConfig: config.overrideConfig ?? configDefaults.overrideConfig,
    flags: config.flags ?? configDefaults.flags,
  };
}
