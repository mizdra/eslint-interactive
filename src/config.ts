import { ESLint } from 'eslint';
import { FlatESLintOptions as _FlatESLintOptions } from 'eslint/use-at-your-own-risk';
import { cliOptionsDefaults, ParsedCLIOptions } from './cli/parse-argv.js';
import { DeepPartial } from './util/type-check.js';

export type ESLintrcESLintOptions = { type: 'eslintrc' } & Pick<
  ESLint.Options,
  | 'useEslintrc'
  | 'overrideConfigFile'
  | 'extensions'
  | 'rulePaths'
  | 'ignorePath'
  | 'cache'
  | 'cacheLocation'
  | 'overrideConfig'
  | 'cwd'
  | 'resolvePluginsRelativeTo'
>;

export type FlatESLintOptions = { type: 'flat' } & Pick<
  _FlatESLintOptions,
  'overrideConfigFile' | 'cache' | 'cacheLocation' | 'overrideConfig' | 'cwd'
>;

export type ESLintOptions = ESLintrcESLintOptions | FlatESLintOptions;

/** The config of eslint-interactive */
export type Config = {
  patterns: string[];
  formatterName?: string | undefined;
  quiet?: boolean | undefined;
  cwd?: string | undefined;
  eslintOptions: ESLintOptions;
};

type ESLintOptionsType = 'eslintrc' | 'flat';

export function translateCLIOptions(options: ParsedCLIOptions, eslintOptionsType: ESLintOptionsType): Config {
  if (eslintOptionsType === 'eslintrc') {
    return {
      patterns: options.patterns,
      formatterName: options.formatterName,
      quiet: options.quiet,
      eslintOptions: {
        type: 'eslintrc',
        useEslintrc: options.useEslintrc,
        overrideConfigFile: options.overrideConfigFile,
        extensions: options.extensions,
        rulePaths: options.rulePaths,
        ignorePath: options.ignorePath,
        cache: options.cache,
        cacheLocation: options.cacheLocation,
        resolvePluginsRelativeTo: options.resolvePluginsRelativeTo,
      },
    };
  } else if (eslintOptionsType === 'flat') {
    return {
      patterns: options.patterns,
      formatterName: options.formatterName,
      quiet: options.quiet,
      eslintOptions: {
        type: 'flat',
        overrideConfigFile: options.overrideConfigFile,
        cache: options.cache,
        cacheLocation: options.cacheLocation,
      },
    };
  } else {
    throw new Error(`Unexpected configType: ${String(eslintOptionsType)}`);
  }
}

/** Default config of `Core` */
export const configDefaults = {
  formatterName: cliOptionsDefaults.formatterName,
  quiet: cliOptionsDefaults.quiet,
  cwd: process.cwd(),
  eslintOptions: {
    useEslintrc: cliOptionsDefaults.useEslintrc,
    overrideConfigFile: undefined,
    extensions: undefined,
    rulePaths: undefined,
    ignorePath: undefined,
    cache: cliOptionsDefaults.cache,
    cacheLocation: cliOptionsDefaults.cacheLocation,
    overrideConfig: undefined,
    resolvePluginsRelativeTo: undefined,
  },
} satisfies DeepPartial<Config>;

export type NormalizedConfig = {
  patterns: string[];
  formatterName: string;
  quiet: boolean;
  cwd: string;
  eslintOptions: ESLintOptions;
};

// eslint-disable-next-line complexity
export function normalizeConfig(config: Config): NormalizedConfig {
  const cwd = config.cwd ?? configDefaults.cwd;
  const type = config.eslintOptions.type;
  if (type === 'eslintrc') {
    return {
      patterns: config.patterns,
      formatterName: config.formatterName ?? configDefaults.formatterName,
      quiet: config.quiet ?? configDefaults.quiet,
      cwd,
      eslintOptions: {
        type: 'eslintrc',
        useEslintrc: config.eslintOptions.useEslintrc ?? configDefaults.eslintOptions.useEslintrc,
        overrideConfigFile: config.eslintOptions.overrideConfigFile ?? configDefaults.eslintOptions.overrideConfigFile,
        extensions: config.eslintOptions.extensions ?? configDefaults.eslintOptions.extensions,
        rulePaths: config.eslintOptions.rulePaths ?? configDefaults.eslintOptions.rulePaths,
        ignorePath: config.eslintOptions.ignorePath ?? configDefaults.eslintOptions.ignorePath,
        cache: config.eslintOptions.cache ?? configDefaults.eslintOptions.cache,
        cacheLocation: config.eslintOptions.cacheLocation ?? configDefaults.eslintOptions.cacheLocation,
        overrideConfig: config.eslintOptions.overrideConfig ?? configDefaults.eslintOptions.overrideConfig,
        cwd,
        resolvePluginsRelativeTo:
          config.eslintOptions.resolvePluginsRelativeTo ?? configDefaults.eslintOptions.resolvePluginsRelativeTo,
      },
    };
  } else if (type === 'flat') {
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
      },
    };
  } else {
    throw new Error(`Unexpected configType: ${String(type)}`);
  }
}
