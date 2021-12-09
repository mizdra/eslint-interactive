import { tmpdir } from 'os';
import { join } from 'path';
import { ESLint } from 'eslint';
import pager from 'node-pager';
import { format } from './formatter';
import { TransformRuleOption } from './rules/transform';
import { SuggestionFilter } from './transforms/apply-suggestions';
import { Config, DisplayMode, Transform } from './types';
import { filterResultsByRuleId, scanUsedPluginsFromResults } from './util/eslint';

/**
 * The core of eslint-interactive.
 * It uses ESLint's Node.js API to output a summary of problems, fix problems, apply suggestions, etc.
 */
export class ESLintDecorator {
  readonly config: Config;

  constructor(config: Config) {
    this.config = config;
  }

  /** The base options of ESLint */
  get baseOptions(): ESLint.Options {
    return {
      cache: true,
      cacheLocation: join(tmpdir(), `eslint-interactive--${Date.now()}-${Math.random()}`),
      rulePaths: this.config.rulePaths,
      extensions: this.config.extensions,
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
   * Print summary of lint results.
   * @param results The lint results of the project to print summary
   */
  printSummaryOfResults(results: ESLint.LintResult[]): void {
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

    const resultText = format(results, { rulesMeta: rulesMeta });
    console.log(resultText);
  }

  /**
   * Print details of lint results.
   * @param displayMode How to display a problem
   * @param results The lint results of the project to print summary
   * @param ruleIds The rule ids to print details
   */
  async printDetailsOfResults(
    results: ESLint.LintResult[],
    ruleIds: (string | null)[],
    displayMode: DisplayMode,
  ): Promise<void> {
    const eslint = new ESLint(this.baseOptions);
    const formatter = await eslint.loadFormatter(this.config.formatterName);
    const resultText = formatter.format(filterResultsByRuleId(results, ruleIds));
    if (displayMode === 'withPager') {
      await pager(resultText);
    } else {
      console.log(resultText);
    }
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
   * Transform source codes.
   * @param transform The transform information to do.
   */
  private async transform(results: ESLint.LintResult[], ruleIds: string[], transform: Transform) {
    const eslint = new ESLint({
      ...this.baseOptions,
      overrideConfig: {
        rules: {
          transform: [2, { results, ruleIds, transform } as TransformRuleOption],
        },
      },
      rulePaths: [...(this.baseOptions.rulePaths ?? []), join(__dirname, 'rules')],
      // NOTE: Only fix the `transform` rule problems.
      fix: (message) => message.ruleId === 'transform',
    });
    const newResults = await eslint.lintFiles(this.config.patterns);
    await ESLint.outputFixes(newResults);
  }
}
