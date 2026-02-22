import type { ESLint } from 'eslint';
import type { ParsedCLIOptions } from './cli/parse-argv.js';
import { cliOptionsDefaults } from './cli/parse-argv.js';
import type { DeepPartial } from './util/type-check.js';

export type ESLintOptions = { type: 'flat' } & Pick<
  ESLint.Options,
  'overrideConfigFile' | 'cache' | 'cacheLocation' | 'overrideConfig' | 'cwd' | 'flags'
>;

/** The config of eslint-interactive */
export type Config = {
  patterns: string[];
  formatterName?: string | undefined;
  quiet?: boolean | undefined;
  cwd?: string | undefined;
  eslintOptions: ESLintOptions;
  flags?: string[] | undefined;
};

export function translateCLIOptions(options: ParsedCLIOptions): Config {
  return {
    patterns: options.patterns,
    formatterName: options.formatterName,
    quiet: options.quiet,
    eslintOptions: {
      type: 'flat',
      overrideConfigFile: options.overrideConfigFile,
      cache: options.cache,
      cacheLocation: options.cacheLocation,
      flags: options.flags,
    },
  };
}

/** Default config of `Core` */
export const configDefaults = {
  formatterName: cliOptionsDefaults.formatterName,
  quiet: cliOptionsDefaults.quiet,
  cwd: process.cwd(),
  eslintOptions: {
    overrideConfigFile: undefined,
    cache: cliOptionsDefaults.cache,
    cacheLocation: undefined,
    overrideConfig: undefined,
    flags: undefined,
  },
} satisfies DeepPartial<Config>;

export type NormalizedConfig = {
  patterns: string[];
  formatterName: string;
  quiet: boolean;
  cwd: string;
  eslintOptions: ESLintOptions;
};

export function normalizeConfig(config: Config): NormalizedConfig {
  const cwd = config.cwd ?? configDefaults.cwd;
  return {
    patterns: config.patterns,
    formatterName: config.formatterName ?? configDefaults.formatterName,
    quiet: config.quiet ?? configDefaults.quiet,
    cwd,
    eslintOptions: {
      type: 'flat',
      overrideConfigFile: config.eslintOptions.overrideConfigFile ?? configDefaults.eslintOptions.overrideConfigFile,
      cache: config.eslintOptions.cache ?? configDefaults.eslintOptions.cache,
      cacheLocation: config.eslintOptions.cacheLocation ?? configDefaults.eslintOptions.cacheLocation,
      overrideConfig: config.eslintOptions.overrideConfig ?? configDefaults.eslintOptions.overrideConfig,
      cwd,
      flags: config.eslintOptions.flags ?? configDefaults.eslintOptions.flags,
    },
  };
}
