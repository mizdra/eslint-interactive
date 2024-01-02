import { writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { ESLint, Linter, Rule } from 'eslint';
import isInstalledGlobally from 'is-installed-globally';
import { DescriptionPosition } from './cli/prompt.js';
import { Config, NormalizedConfig, normalizeConfig } from './config.js';
import { format } from './formatter/index.js';
import { createFixToApplyAutoFixes } from './plugin/fix/apply-auto-fixes.js';
import { createFixToApplySuggestions } from './plugin/fix/apply-suggestions.js';
import { createFixToConvertErrorToWarningPerFile } from './plugin/fix/convert-error-to-warning-per-file.js';
import { createFixToDisablePerFile } from './plugin/fix/disable-per-file.js';
import { createFixToDisablePerLine } from './plugin/fix/disable-per-line.js';
import { createFixToMakeFixableAndFix } from './plugin/fix/make-fixable-and-fix.js';
import { FixResult } from './plugin/fixer.js';
import { FixableMaker, SuggestionFilter, FixContext } from './plugin/index.js';
import { ruleFixer } from './plugin/rule-fixer.js';
import { SourceCodeFixer } from './plugin/source-code-fixer.js';
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
    return this.fix(results, ruleIds, (context) => createFixToApplyAutoFixes(context, {}));
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
    return this.fix(results, ruleIds, (context) =>
      createFixToDisablePerLine(context, { description, descriptionPosition }),
    );
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
    return this.fix(results, ruleIds, (context) =>
      createFixToDisablePerFile(context, { description, descriptionPosition }),
    );
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
    return this.fix(results, ruleIds, (context) => createFixToConvertErrorToWarningPerFile(context, { description }));
  }

  /**
   * Apply suggestions.
   * @param results The lint results of the project to apply suggestions
   * @param ruleIds The rule ids to apply suggestions
   * @param filter The script to filter suggestions
   */
  async applySuggestions(results: ESLint.LintResult[], ruleIds: string[], filter: SuggestionFilter): Promise<Undo> {
    return this.fix(results, ruleIds, (context) => createFixToApplySuggestions(context, { filter }));
  }

  /**
   * Make forcibly fixable and run `eslint --fix`.
   * @param results The lint results of the project to apply suggestions
   * @param ruleIds The rule ids to apply suggestions
   * @param fixableMaker The function to make `Linter.LintMessage` forcibly fixable.
   */
  async makeFixableAndFix(results: ESLint.LintResult[], ruleIds: string[], fixableMaker: FixableMaker): Promise<Undo> {
    return this.fix(results, ruleIds, (context) => createFixToMakeFixableAndFix(context, { fixableMaker }));
  }

  /**
   * Fix source codes.
   * @param fix The fix information to do.
   */
  private async fix(
    resultsOfLint: ESLint.LintResult[],
    ruleIds: string[],
    fixCreator: (context: FixContext) => Rule.Fix[],
  ): Promise<Undo> {
    // NOTE: Extract only necessary results and files for performance
    const filteredResultsOfLint = filterResultsByRuleId(resultsOfLint, ruleIds);
    const linter = new Linter();

    // eslint-disable-next-line prefer-const
    for (let { filePath, messages, source } of filteredResultsOfLint) {
      if (!source) throw new Error('Source code is required to apply fixes.');
      // eslint-disable-next-line no-await-in-loop
      const config: Linter.Config = await this.eslint.calculateConfigForFile(filePath);

      // Get `SourceCode` instance
      linter.verify(source, config, filePath);
      let sourceCode = linter.getSourceCode();

      let fixResult: FixResult | undefined;
      for (let i = 0; i < MAX_AUTOFIX_PASSES; i++) {
        // Create `Rule.Fix[]`
        const fixContext: FixContext = {
          filename: filePath,
          sourceCode,
          messages: messages.filter((message) => message.ruleId && ruleIds.includes(message.ruleId)),
          ruleIds,
          fixer: ruleFixer,
        };
        const fixes = fixCreator(fixContext);

        // Apply `Rule.Fix[]`
        fixResult = SourceCodeFixer.applyFixes(
          sourceCode.text,
          fixes.map((fix) => {
            return {
              ruleId: 'eslint-interactive/fix',
              severity: 2,
              message: 'fix',
              line: 0,
              column: 0,
              fix,
            };
          }),
          true,
        );

        // Lint `fixResult.output` again and check if there are any problems.
        // If there are problems, retry to fix. If not, exit the loop.
        messages = linter.verify(fixResult.output, config, filePath);
        sourceCode = linter.getSourceCode();
        if (messages.length === 0) break;
      }

      // Write the fixed source code to the file
      if (fixResult && fixResult.fixed) {
        // eslint-disable-next-line no-await-in-loop, @typescript-eslint/no-non-null-assertion
        await writeFile(filePath, fixResult.output);
      }
    }

    return async () => {
      const resultsToUndo = generateResultsToUndo(filteredResultsOfLint);
      await ESLint.outputFixes(resultsToUndo);
    };
  }
}
