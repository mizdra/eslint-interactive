import { writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { ESLint, Linter, Rule } from 'eslint';
import eslintPkg from 'eslint/use-at-your-own-risk';
import isInstalledGlobally from 'is-installed-globally';
import { DescriptionPosition } from './cli/prompt.js';
import { Config, NormalizedConfig, normalizeConfig } from './config.js';
import {
  createFixToApplyAutoFixes,
  createFixToApplySuggestions,
  createFixToConvertErrorToWarningPerFile,
  createFixToDisablePerFile,
  createFixToDisablePerLine,
  createFixToMakeFixableAndFix,
  FixableMaker,
  SuggestionFilter,
  FixContext,
  verifyAndFix,
} from './fix/index.js';
import { format } from './formatter/index.js';
import { filterResultsByRuleId } from './util/eslint.js';

const { LegacyESLint, FlatESLint } = eslintPkg;

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
  readonly eslint: InstanceType<typeof LegacyESLint | typeof FlatESLint>;

  constructor(config: Config) {
    this.config = normalizeConfig(config);
    const eslintOptions = this.config.eslintOptions;
    if (eslintOptions.type === 'eslintrc') {
      const { type, ...rest } = eslintOptions;
      this.eslint = new LegacyESLint(rest);
    } else {
      const { type, ...rest } = eslintOptions;
      this.eslint = new FlatESLint(rest);
    }
  }

  /**
   * Lint project.
   * @returns The results of linting
   */
  async lint(): Promise<ESLint.LintResult[]> {
    let results = await this.eslint.lintFiles(this.config.patterns);
    if (this.config.quiet) results = LegacyESLint.getErrorResults(results);
    return results;
  }

  /**
   * Returns summary of lint results.
   * @param results The lint results of the project to print summary
   */
  formatResultSummary(results: ESLint.LintResult[]): string {
    const rulesMeta = this.eslint.getRulesMetaForResults(results);
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
    const rulesMeta = this.eslint.getRulesMetaForResults(results);
    return formatter.format(filterResultsByRuleId(results, ruleIds), { rulesMeta, cwd: this.config.cwd });
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
    const linter = new Linter({ configType: this.config.eslintOptions.type });

    // eslint-disable-next-line prefer-const
    for (let { filePath, source } of filteredResultsOfLint) {
      if (!source) throw new Error('Source code is required to apply fixes.');
      const config: Linter.LegacyConfig | Linter.FlatConfig[] =
        this.config.eslintOptions.type === 'eslintrc'
          ? // eslint-disable-next-line no-await-in-loop
            await this.eslint.calculateConfigForFile(filePath)
          : // NOTE: For some reason, if files is not specified, it will not match .jsx
            // eslint-disable-next-line no-await-in-loop
            [{ ...(await calculateConfigForFile(this.eslint, filePath)), files: ['**/*.*', '**/*'] }];

      const fixedResult = verifyAndFix(linter, source, config, filePath, ruleIds, fixCreator);

      // Write the fixed source code to the file
      if (fixedResult.fixed) {
        // eslint-disable-next-line no-await-in-loop, @typescript-eslint/no-non-null-assertion
        await writeFile(filePath, fixedResult.output);
      }
    }

    return async () => {
      const resultsToUndo = generateResultsToUndo(filteredResultsOfLint);
      await LegacyESLint.outputFixes(resultsToUndo);
    };
  }
}

async function calculateConfigForFile(
  eslint: InstanceType<typeof LegacyESLint | typeof FlatESLint>,
  filePath: string,
): Promise<Linter.FlatConfig> {
  const config = await eslint.calculateConfigForFile(filePath);
  // `language` property has been added to the object returned by `ESLint.prototype.calculateConfigForFile(filePath)` since ESLint v9.5.0.
  // But, `Linter.prototype.verify()` does not accept `language` option. So, remove it.
  delete config['language'];
  return config;
}
