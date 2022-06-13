import { join } from 'path';
import { fileURLToPath } from 'url';
import { ESLint } from 'eslint';
import isInstalledGlobally from 'is-installed-globally';
import { format } from './formatter/index.js';
import {
  eslintInteractivePlugin,
  FixRuleOption,
  FixableMaker,
  SuggestionFilter,
  Fix,
  OVERLAPPED_PROBLEM_MESSAGE,
} from './plugin/index.js';
import { unique } from './util/array.js';
import { getCacheDir } from './util/cache.js';
import { filterResultsByRuleId, scanUsedPluginsFromResults } from './util/eslint.js';

const MAX_AUTOFIX_PASSES = 10;

/**
 * Generate results to undo.
 * @param resultsOfLint The results of lint.
 * @returns The results to undo.
 */
function generateResultsToUndo(resultsOfLint: ESLint.LintResult[]): ESLint.LintResult[] {
  return resultsOfLint.map((resultOfLint) => {
    // NOTE: THIS IS HACK.
    return { ...resultOfLint, output: resultOfLint.source };
  });
}

function hasOverlappedProblems(results: ESLint.LintResult[]): boolean {
  return results.flatMap((result) => result.messages).some((message) => message.message === OVERLAPPED_PROBLEM_MESSAGE);
}

/**
 * Get all the rules loaded from eslintrc.
 * @param targetFilePaths The target file paths.
 * @param options The eslint option.
 * @returns The rule ids loaded from eslintrc.
 */
async function getUsedRuleIds(targetFilePaths: string[], options: ESLint.Options): Promise<string[]> {
  const eslintToGetRules = new ESLint(options);
  const configs = await Promise.all(
    targetFilePaths.map(async (filePath) => eslintToGetRules.calculateConfigForFile(filePath)),
  );
  return unique(configs.map((config) => config.rules).flatMap((rules) => Object.keys(rules)));
}

export type Undo = () => Promise<void>;

/** The config of eslint-interactive */
export type Config = {
  patterns: string[];
  rulePaths?: string[] | undefined;
  extensions?: string[] | undefined;
  formatterName?: string;
  quiet?: boolean;
  cache?: boolean;
  cacheLocation?: string;
  cwd?: string;
};

/** Default config of `Core` */
export const DEFAULT_BASE_CONFIG = {
  cache: true,
  cacheLocation: join(getCacheDir(), '.eslintcache'),
  formatterName: 'codeframe',
  quiet: false,
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
    let results = await eslint.lintFiles(this.config.patterns);
    if (this.config.quiet) results = ESLint.getErrorResults(results);
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

    return format(results, { rulesMeta: rulesMeta, cwd: this.config.cwd ?? process.cwd() });
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
              await import.meta.resolve('eslint-interactive'),
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
  async applyAutoFixes(results: ESLint.LintResult[], ruleIds: string[]): Promise<Undo> {
    return await this.fix(results, ruleIds, { name: 'applyAutoFixes', args: {} });
  }

  /**
   * Add disable comments per line.
   * @param results The lint results of the project to add disable comments
   * @param ruleIds The rule ids to add disable comments
   * @param description The description of the disable comments
   */
  async disablePerLine(results: ESLint.LintResult[], ruleIds: string[], description?: string): Promise<Undo> {
    return await this.fix(results, ruleIds, { name: 'disablePerLine', args: { description } });
  }

  /**
   * Add disable comments per file.
   * @param results The lint results of the project to add disable comments
   * @param ruleIds The rule ids to add disable comments
   * @param description The description of the disable comments
   */
  async disablePerFile(results: ESLint.LintResult[], ruleIds: string[], description?: string): Promise<Undo> {
    return await this.fix(results, ruleIds, { name: 'disablePerFile', args: { description } });
  }

  /**
   * Apply suggestions.
   * @param results The lint results of the project to apply suggestions
   * @param ruleIds The rule ids to apply suggestions
   * @param filter The script to filter suggestions
   * */
  async applySuggestions(results: ESLint.LintResult[], ruleIds: string[], filter: SuggestionFilter): Promise<Undo> {
    return await this.fix(results, ruleIds, { name: 'applySuggestions', args: { filter } });
  }

  /**
   * Make forcibly fixable and run `eslint --fix`.
   * @param results The lint results of the project to apply suggestions
   * @param ruleIds The rule ids to apply suggestions
   * @param fixableMaker The function to make `Linter.LintMessage` forcibly fixable.
   * */
  async makeFixableAndFix(results: ESLint.LintResult[], ruleIds: string[], fixableMaker: FixableMaker): Promise<Undo> {
    return await this.fix(results, ruleIds, { name: 'makeFixableAndFix', args: { fixableMaker } });
  }

  /**
   * Fix source codes.
   * @param fix The fix information to do.
   */
  private async fix(resultsOfLint: ESLint.LintResult[], ruleIds: string[], fix: Fix): Promise<Undo> {
    // NOTE: Extract only necessary results and files for performance
    const filteredResultsOfLint = filterResultsByRuleId(resultsOfLint, ruleIds);
    const targetFilePaths = filteredResultsOfLint.map((result) => result.filePath);
    const usedRuleIds = await getUsedRuleIds(targetFilePaths, this.baseOptions);

    // TODO: refactor
    let results = filteredResultsOfLint;
    for (let i = 0; i < MAX_AUTOFIX_PASSES; i++) {
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
            'eslint-interactive/fix': [2, { results, ruleIds, fix } as FixRuleOption],
            // Turn off all rules except `eslint-interactive/fix` when fixing for performance.
            ...Object.fromEntries(usedRuleIds.map((ruleId) => [ruleId, 'off'])),
          },
        },
        // NOTE: Only fix the `fix` rule problems.
        fix: (message) => message.ruleId === 'eslint-interactive/fix',
        // Don't interpret lintFiles arguments as glob patterns for performance.
        globInputPaths: false,
      });
      const resultsToFix = await eslint.lintFiles(targetFilePaths);
      await ESLint.outputFixes(resultsToFix);
      if (!hasOverlappedProblems(resultsToFix)) break;
      results = await this.lint();
    }

    return async () => {
      const resultsToUndo = generateResultsToUndo(filteredResultsOfLint);
      await ESLint.outputFixes(resultsToUndo);
    };
  }
}
