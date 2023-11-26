import { join, relative } from 'node:path';
import { ESLint } from 'eslint';
import { ParsedCLIOptions } from './cli/parse-argv.js';
import { getCacheDir } from './util/cache.js';
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

export type ESLintOptions = ESLintrcESLintOptions; // TODO: support flat config

/** The config of eslint-interactive */
export type Config = {
  patterns: string[];
  formatterName?: string | undefined;
  quiet?: boolean | undefined;
  cwd?: string | undefined;
  eslintOptions: ESLintOptions;
};

/** Default config of `Core` */
export const configDefaults = {
  formatterName: 'codeframe',
  quiet: false,
  cwd: process.cwd(),
  eslintOptions: {
    useEslintrc: true,
    overrideConfigFile: undefined,
    extensions: undefined,
    rulePaths: undefined,
    ignorePath: undefined,
    cache: true,
    cacheLocation: relative(process.cwd(), join(getCacheDir(), '.eslintcache')),
    overrideConfig: undefined,
    resolvePluginsRelativeTo: undefined,
  },
} satisfies DeepPartial<Config>;

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
    throw new Error('Flat config is not supported yet');
  } else {
    throw new Error(`Unexpected configType: ${String(eslintOptionsType)}`);
  }
}
