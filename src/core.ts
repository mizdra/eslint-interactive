import { join } from 'path';
import { fileURLToPath } from 'url';
import { ESLint } from 'eslint';
// eslint-disable-next-line @typescript-eslint/no-require-imports
import isInstalledGlobally = require('is-installed-globally');
import { format } from './formatter/index.js';
import {
  eslintInteractivePlugin,
  TransformRuleOption,
  FixableMaker,
  SuggestionFilter,
  Transform,
} from './plugin/index.js';
import { getCacheDir } from './util/cache.js';
import { filterResultsByRuleId, scanUsedPluginsFromResults } from './util/eslint.js';

/** The config of eslint-interactive */
export type Config = {
  patterns: string[];
  rulePaths?: string[] | undefined;
  extensions?: string[] | undefined;
  formatterName?: string;
  cache?: boolean;
  cacheLocation?: string;
  cwd?: string;
};

/** Default config of `Core` */
export const DEFAULT_BASE_CONFIG = {
  cache: true,
  cacheLocation: join(getCacheDir(), '.eslintcache'),
  formatterName: 'codeframe',
};

/**
 * The core of eslint-interactive.
 * It uses ESLint's Node.js API to output a summary of problems, fix problems, apply suggestions, etc.
 */
export class Core {
  readonly config: Config;
  /** The base options of ESLint */
  readonly baseOptions: ESLint.Options;

  constructor(config: Config) {
    this.config = config;
    this.baseOptions = {
      cache: this.config.cache ?? DEFAULT_BASE_CONFIG.cache,
      cacheLocation: this.config.cacheLocation ?? DEFAULT_BASE_CONFIG.cacheLocation,
      rulePaths: this.config.rulePaths,
      extensions: this.config.extensions,
      cwd: this.config.cwd,
    };
  }

  /**
   * Lint project.
   * @returns The results of linting
   */
  async lint(): Promise<ESLint.LintResult[]> {
    const eslint = new ESLint(this.baseOptions);
    const results = await eslint.lintFiles(this.config.patterns);
    return results;
  }

  /**
   * Returns summary of lint results.
   * @param results The lint results of the project to print summary
   */
  formatResultSummary(results: ESLint.LintResult[]): string {
    // get used plugins from `results`
    const plugins = scanUsedPluginsFromResults(results);

    // get `rulesMeta` from `results`
    const eslint = new ESLint({
      ...this.baseOptions,
      overrideConfig: { plugins },
    });
    // NOTE: `getRulesMetaForResults` is a feature added in ESLint 7.29.0.
    // Therefore, the function may not exist in versions lower than 7.29.0.
    const rulesMeta: ESLint.LintResultData['rulesMeta'] = eslint.getRulesMetaForResults?.(results) ?? {};

    return format(results, { rulesMeta: rulesMeta });
  }

  /**
   * Returns details of lint results.
   * @param results The lint results of the project to print summary
   * @param ruleIds The rule ids to print details
   */
  async formatResultDetails(results: ESLint.LintResult[], ruleIds: (string | null)[]): Promise<string> {
    const eslint = new ESLint(this.baseOptions);
    const formatterName = this.config.formatterName ?? DEFAULT_BASE_CONFIG.formatterName;

    // When eslint-interactive is installed globally, eslint-formatter-codeframe will also be installed globally.
    // On the other hand, `eslint.loadFormatter` cannot load the globally installed formatter by name. So here it loads them by path.
    const resolvedFormatterNameOrPath =
      isInstalledGlobally && formatterName === 'codeframe'
        ? fileURLToPath(
            // @ts-expect-error
            await import.meta.resolve(
              'eslint-formatter-codeframe',
              // @ts-expect-error
              await import.meta.resolve('@mizdra/eslint-interactive'),
            ),
          )
        : formatterName;

    const formatter = await eslint.loadFormatter(resolvedFormatterNameOrPath);
    return formatter.format(filterResultsByRuleId(results, ruleIds));
  }

  /**
   * Run `eslint --fix`.
   * @param ruleIds The rule ids to fix
   */
  async fix(ruleIds: string[]): Promise<void> {
    const eslint = new ESLint({
      ...this.baseOptions,
      fix: (message) => message.ruleId !== null && ruleIds.includes(message.ruleId),
    });
    const results = await eslint.lintFiles(this.config.patterns);
    await ESLint.outputFixes(results);
  }

  /**
   * Add disable comments per line.
   * @param results The lint results of the project to add disable comments
   * @param ruleIds The rule ids to add disable comments
   * @param description The description of the disable comments
   */
  async disablePerLine(results: ESLint.LintResult[], ruleIds: string[], description?: string): Promise<void> {
    await this.transform(results, ruleIds, { name: 'disablePerLine', args: { description } });
  }

  /**
   * Add disable comments per file.
   * @param results The lint results of the project to add disable comments
   * @param ruleIds The rule ids to add disable comments
   * @param description The description of the disable comments
   */
  async disablePerFile(results: ESLint.LintResult[], ruleIds: string[], description?: string): Promise<void> {
    await this.transform(results, ruleIds, { name: 'disablePerFile', args: { description } });
  }

  /**
   * Apply suggestions.
   * @param results The lint results of the project to apply suggestions
   * @param ruleIds The rule ids to apply suggestions
   * @param filter The script to filter suggestions
   * */
  async applySuggestions(results: ESLint.LintResult[], ruleIds: string[], filter: SuggestionFilter): Promise<void> {
    await this.transform(results, ruleIds, { name: 'applySuggestions', args: { filter } });
  }

  /**
   * Make forcibly fixable and run `eslint --fix`.
   * @param results The lint results of the project to apply suggestions
   * @param ruleIds The rule ids to apply suggestions
   * @param fixableMaker The function to make `Linter.LintMessage` forcibly fixable.
   * */
  async makeFixableAndFix(results: ESLint.LintResult[], ruleIds: string[], fixableMaker: FixableMaker): Promise<void> {
    await this.transform(results, ruleIds, { name: 'makeFixableAndFix', args: { fixableMaker } });
  }

  /**
   * Transform source codes.
   * @param transform The transform information to do.
   */
  private async transform(results: ESLint.LintResult[], ruleIds: string[], transform: Transform) {
    const eslint = new ESLint({
      ...this.baseOptions,
      // This is super hack to load ESM plugin/rule.
      // ref: https://github.com/eslint/eslint/issues/15453#issuecomment-1001200953
      plugins: {
        'eslint-interactive': eslintInteractivePlugin,
      },
      overrideConfig: {
        plugins: ['eslint-interactive'],
        rules: {
          'eslint-interactive/transform': [2, { results, ruleIds, transform } as TransformRuleOption],
        },
      },
      // NOTE: Only fix the `transform` rule problems.
      fix: (message) => message.ruleId === 'eslint-interactive/transform',
    });
    const newResults = await eslint.lintFiles(this.config.patterns);
    await ESLint.outputFixes(newResults);
  }
}
