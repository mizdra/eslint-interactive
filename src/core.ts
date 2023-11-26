import { fileURLToPath } from 'node:url';
import { ESLint } from 'eslint';
import isInstalledGlobally from 'is-installed-globally';
import { DescriptionPosition } from './cli/prompt.js';
import { Config, NormalizedConfig, normalizeConfig } from './config.js';
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
import { filterResultsByRuleId } from './util/eslint.js';

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
 * @param eslint The eslint instance.
 * @param targetFilePaths The target file paths.
 * @returns The rule ids loaded from eslintrc.
 */
async function getUsedRuleIds(eslint: ESLint, targetFilePaths: string[]): Promise<string[]> {
  const configs = await Promise.all(targetFilePaths.map(async (filePath) => eslint.calculateConfigForFile(filePath)));
  return unique(configs.map((config) => config.rules).flatMap((rules) => Object.keys(rules)));
}

export type Undo = () => Promise<void>;

/**
 * The core of eslint-interactive.
 * It uses ESLint's Node.js API to output a summary of problems, fix problems, apply suggestions, etc.
 */
export class Core {
  readonly config: NormalizedConfig;
  readonly eslint: ESLint;

  constructor(config: Config) {
    this.config = normalizeConfig(config);
    const { type, ...eslintOptions } = this.config.eslintOptions;
    this.eslint = new ESLint(eslintOptions);
  }

  /**
   * Lint project.
   * @returns The results of linting
   */
  async lint(): Promise<ESLint.LintResult[]> {
    let results = await this.eslint.lintFiles(this.config.patterns);
    if (this.config.quiet) results = ESLint.getErrorResults(results);
    return results;
  }

  /**
   * Returns summary of lint results.
   * @param results The lint results of the project to print summary
   */
  formatResultSummary(results: ESLint.LintResult[]): string {
    // NOTE: `getRulesMetaForResults` is a feature added in ESLint 7.29.0.
    // Therefore, the function may not exist in versions lower than 7.29.0.
    const rulesMeta: ESLint.LintResultData['rulesMeta'] = this.eslint.getRulesMetaForResults?.(results) ?? {};

    return format(results, { rulesMeta, cwd: this.config.cwd });
  }

  /**
   * Returns details of lint results.
   * @param results The lint results of the project to print summary
   * @param ruleIds The rule ids to print details
   */
  async formatResultDetails(results: ESLint.LintResult[], ruleIds: (string | null)[]): Promise<string> {
    const formatterName = this.config.formatterName;

    // When eslint-interactive is installed globally, eslint-formatter-codeframe will also be installed globally.
    // On the other hand, `eslint.loadFormatter` cannot load the globally installed formatter by name. So here it loads them by path.
    const resolvedFormatterNameOrPath =
      isInstalledGlobally && formatterName === 'codeframe'
        ? fileURLToPath(import.meta.resolve('eslint-formatter-codeframe', import.meta.resolve('eslint-interactive')))
        : formatterName;

    const formatter = await this.eslint.loadFormatter(resolvedFormatterNameOrPath);
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
    const targetFilePaths = filteredResultsOfLint.map((result) => result.filePath);
    const usedRuleIds = await getUsedRuleIds(this.eslint, targetFilePaths);

    // TODO: refactor
    let results = filteredResultsOfLint;
    for (let i = 0; i < MAX_AUTOFIX_PASSES; i++) {
      const { type, ...eslintOptions } = this.config.eslintOptions;
      const eslint = new ESLint({
        ...eslintOptions,
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
      // eslint-disable-next-line no-await-in-loop
      const resultsToFix = await eslint.lintFiles(targetFilePaths);
      // eslint-disable-next-line no-await-in-loop
      await ESLint.outputFixes(resultsToFix);
      if (!hasOverlappedProblems(resultsToFix)) break;
      // eslint-disable-next-line no-await-in-loop
      results = await this.lint();
    }

    return async () => {
      const resultsToUndo = generateResultsToUndo(filteredResultsOfLint);
      await ESLint.outputFixes(resultsToUndo);
    };
  }
}
