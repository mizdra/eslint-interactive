import { writeFile } from 'node:fs/promises';
import { join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';
import { ESLint, Linter } from 'eslint';
import isInstalledGlobally from 'is-installed-globally';
import { DescriptionPosition } from './cli/prompt.js';
import { format } from './formatter/index.js';
import {
  applyFixes,
  eslintInteractivePlugin,
  type FixerOptions,
  FixableMaker,
  SuggestionFilter,
  Fix,
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
export type Config = Pick<
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
> & {
  patterns: string[];
  formatterName?: string | undefined;
  quiet?: boolean | undefined;
};

/** Default config of `Core` */
export const DEFAULT_BASE_CONFIG: Partial<Config> = {
  useEslintrc: true,
  cwd: undefined,
  cache: true,
  cacheLocation: relative(process.cwd(), join(getCacheDir(), '.eslintcache')),
  extensions: undefined,
  formatterName: 'codeframe',
  quiet: false,
  rulePaths: undefined,
  resolvePluginsRelativeTo: undefined,
};

/**
 * The core of eslint-interactive.
 * It uses ESLint's Node.js API to output a summary of problems, fix problems, apply suggestions, etc.
 */
export class Core {
  readonly config: Config;
  /** The base options of ESLint */
  readonly baseESLintOptions: ESLint.Options;

  constructor(config: Config) {
    this.config = {
      ...DEFAULT_BASE_CONFIG,
      ...config,
    };
    const { patterns, formatterName, quiet, ...baseOptions } = this.config;
    this.baseESLintOptions = baseOptions;
  }

  /**
   * Lint project.
   * @returns The results of linting
   */
  async lint(): Promise<ESLint.LintResult[]> {
    const eslint = new ESLint(this.baseESLintOptions);
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
      ...this.baseESLintOptions,
      overrideConfig: { ...this.baseESLintOptions.overrideConfig, plugins },
    });
    // NOTE: `getRulesMetaForResults` is a feature added in ESLint 7.29.0.
    // Therefore, the function may not exist in versions lower than 7.29.0.
    const rulesMeta: ESLint.LintResultData['rulesMeta'] = eslint.getRulesMetaForResults?.(results) ?? {};

    return format(results, { rulesMeta, cwd: this.config.cwd ?? process.cwd() });
  }

  /**
   * Returns details of lint results.
   * @param results The lint results of the project to print summary
   * @param ruleIds The rule ids to print details
   */
  async formatResultDetails(results: ESLint.LintResult[], ruleIds: (string | null)[]): Promise<string> {
    const eslint = new ESLint(this.baseESLintOptions);
    const formatterName = this.config.formatterName ?? DEFAULT_BASE_CONFIG.formatterName;

    // When eslint-interactive is installed globally, eslint-formatter-codeframe will also be installed globally.
    // On the other hand, `eslint.loadFormatter` cannot load the globally installed formatter by name. So here it loads them by path.
    const resolvedFormatterNameOrPath =
      isInstalledGlobally && formatterName === 'codeframe'
        ? fileURLToPath(import.meta.resolve('eslint-formatter-codeframe', import.meta.resolve('eslint-interactive')))
        : formatterName;

    const formatter = await eslint.loadFormatter(resolvedFormatterNameOrPath);
    return formatter.format(filterResultsByRuleId(results, ruleIds));
  }

  /**
   * Run `eslint --fix`.
   * @param ruleIds The rule ids to fix
   */
  async applyAutoFixes(results: ESLint.LintResult[], ruleIds: string[]): Promise<Undo> {
    return this.fix(results, ruleIds, { name: 'applyAutoFixes', args: {} });
  }

  /**
   * Add disable comments per line.
   * @param results The lint results of the project to add disable comments
   * @param ruleIds The rule ids to add disable comments
   * @param description The description of the disable comments
   * @param descriptionPosition The position of the description
   */
  async disablePerLine(
    results: ESLint.LintResult[],
    ruleIds: string[],
    description?: string,
    descriptionPosition?: DescriptionPosition,
  ): Promise<Undo> {
    return this.fix(results, ruleIds, { name: 'disablePerLine', args: { description, descriptionPosition } });
  }

  /**
   * Add disable comments per file.
   * @param results The lint results of the project to add disable comments
   * @param ruleIds The rule ids to add disable comments
   * @param description The description of the disable comments
   * @param descriptionPosition The position of the description
   */
  async disablePerFile(
    results: ESLint.LintResult[],
    ruleIds: string[],
    description?: string,
    descriptionPosition?: DescriptionPosition,
  ): Promise<Undo> {
    return this.fix(results, ruleIds, { name: 'disablePerFile', args: { description, descriptionPosition } });
  }

  /**
   * Convert error to warning per file.
   * @param results The lint results of the project to convert
   * @param ruleIds The rule ids to convert
   * @param description The comment explaining the reason for converting
   */
  async convertErrorToWarningPerFile(
    results: ESLint.LintResult[],
    ruleIds: string[],
    description?: string,
  ): Promise<Undo> {
    return this.fix(results, ruleIds, { name: 'convertErrorToWarningPerFile', args: { description } });
  }

  /**
   * Apply suggestions.
   * @param results The lint results of the project to apply suggestions
   * @param ruleIds The rule ids to apply suggestions
   * @param filter The script to filter suggestions
   */
  async applySuggestions(results: ESLint.LintResult[], ruleIds: string[], filter: SuggestionFilter): Promise<Undo> {
    return this.fix(results, ruleIds, { name: 'applySuggestions', args: { filter } });
  }

  /**
   * Make forcibly fixable and run `eslint --fix`.
   * @param results The lint results of the project to apply suggestions
   * @param ruleIds The rule ids to apply suggestions
   * @param fixableMaker The function to make `Linter.LintMessage` forcibly fixable.
   */
  async makeFixableAndFix(results: ESLint.LintResult[], ruleIds: string[], fixableMaker: FixableMaker): Promise<Undo> {
    return this.fix(results, ruleIds, { name: 'makeFixableAndFix', args: { fixableMaker } });
  }

  /**
   * Fix source codes.
   * @param fix The fix information to do.
   */
  private async fix(resultsOfLint: ESLint.LintResult[], ruleIds: string[], fix: Fix): Promise<Undo> {
    // NOTE: Extract only necessary results and files for performance
    const filteredResultsOfLint = filterResultsByRuleId(resultsOfLint, ruleIds);

    // TODO: refactor
    const results = filteredResultsOfLint;
    const eslint = new ESLint(this.baseESLintOptions);
    const linter = new Linter();

    for (let result of results) {
      if (!result.source) throw new Error('Source code is required to apply fixes.');
      let currentText = result.source;
      for (let i = 0; i < MAX_AUTOFIX_PASSES; i++) {
        const fixedResult = applyFixes({ result, ruleIds, fix });

        // update to use the fixed output instead of the original text
        currentText = fixedResult.output;
        if (!fixedResult.fixed) break;
        // eslint-disable-next-line no-await-in-loop
        const config = await eslint.calculateConfigForFile(result.filePath);
        const messages = linter.verify(
          currentText,
          {
            ...config,
            rules: {
              ...(config.rules ?? {}),
            },
          },
          result.filePath,
        );
        result = { ...result, source: currentText, messages };
      }
      // eslint-disable-next-line no-await-in-loop
      await writeFile(result.filePath, currentText);
    }

    return async () => {
      const resultsToUndo = generateResultsToUndo(filteredResultsOfLint);
      await ESLint.outputFixes(resultsToUndo);
    };
  }
}
