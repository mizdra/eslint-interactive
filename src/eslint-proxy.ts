import { tmpdir } from 'os';
import { join } from 'path';
import { ESLint } from 'eslint';
import pager from 'node-pager';
import { format } from './formatter';
import { DisableTarget, AddDisableCommentOption } from './rules/add-disable-comment';
import { ApplySuggestionsOption } from './rules/apply-suggestions';
import { Config, DisplayMode } from './types';
import { groupBy } from './util/array';
import { scanUsedPluginsFromResults } from './util/eslint';
import { notEmpty } from './util/filter';

function filterResultsByRuleId(results: ESLint.LintResult[], ruleIds: string[]): ESLint.LintResult[] {
  return results.map((result) => {
    return {
      ...result,
      messages: result.messages.filter((message) => message.ruleId !== null && ruleIds.includes(message.ruleId)),
    };
  });
}

function generateAddDisableCommentOption(results: ESLint.LintResult[], description?: string): AddDisableCommentOption {
  const targets: DisableTarget[] = [];
  for (const result of results) {
    const messagesByLine = groupBy(result.messages, (message) => message.line);
    for (const [line, messages] of messagesByLine) {
      targets.push({
        filename: result.filePath,
        line,
        ruleIds: messages.map((message) => message.ruleId).filter(notEmpty),
      });
    }
  }
  return { targets, description };
}

function createAddDisableCommentESLint(
  defaultOptions: ESLint.Options,
  results: ESLint.LintResult[],
  description?: string,
): ESLint {
  const option = generateAddDisableCommentOption(results, description);
  const eslint = new ESLint({
    ...defaultOptions,
    overrideConfig: {
      rules: {
        'add-disable-comment': [2, option],
      },
    },
    rulePaths: [...(defaultOptions.rulePaths ?? []), join(__dirname, 'rules')],
    // NOTE: add-disable-comment に関するエラーだけ fix したいのでフィルタしている
    fix: (message) => message.ruleId === 'add-disable-comment',
  });
  return eslint;
}

function createApplySuggestionsESLint(
  defaultOptions: ESLint.Options,
  results: ESLint.LintResult[],
  ruleIds: string[],
  filterScript: string,
): ESLint {
  const eslint = new ESLint({
    ...defaultOptions,
    overrideConfig: {
      rules: {
        'apply-suggestions': [2, { results, ruleIds, filterScript } as ApplySuggestionsOption],
      },
    },
    rulePaths: [...(defaultOptions.rulePaths ?? []), join(__dirname, 'rules')],
    // NOTE: apply-suggestions に関するエラーだけ fix したいのでフィルタしている
    fix: (message) => message.ruleId === 'apply-suggestions',
  });
  return eslint;
}

export class ESLintProxy {
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
   * Print summary of problems.
   * @param results The lint results of the project to print summary
   */
  printProblemSummary(results: ESLint.LintResult[]): void {
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
   * Print details of problems.
   * @param displayMode How to display a problem
   * @param results The lint results of the project to print summary
   * @param ruleIds The rule ids to print details
   */
  async printProblemDetails(displayMode: DisplayMode, results: ESLint.LintResult[], ruleIds: string[]): Promise<void> {
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
   * Fix problems.
   * @param ruleIds The rule ids to fix problems
   */
  async fixProblems(ruleIds: string[]): Promise<void> {
    const eslint = new ESLint({
      ...this.baseOptions,
      fix: (message) => message.ruleId !== null && ruleIds.includes(message.ruleId),
    });
    const results = await eslint.lintFiles(this.config.patterns);
    await ESLint.outputFixes(results);
  }

  /**
   * Add disable comments.
   * @param results The lint results of the project to add disable comments
   * @param ruleIds The rule ids to add disable comments
   * @param description The description of the disable comments
   */
  async addDisableComments(results: ESLint.LintResult[], ruleIds: string[], description?: string): Promise<void> {
    const filteredResults = results.map((result) => {
      const messages = result.messages.filter((message) => message.ruleId && ruleIds.includes(message.ruleId));
      return { ...result, messages };
    });

    const eslint = createAddDisableCommentESLint(this.baseOptions, filteredResults, description);
    const newResults = await eslint.lintFiles(this.config.patterns);
    await ESLint.outputFixes(newResults);
  }

  /**
   * Apply suggestions.
   * @param results The lint results of the project to apply suggestions
   * @param ruleIds The rule ids to apply suggestions
   * @param filterScript The script to filter suggestions
   * */
  async applySuggestions(results: ESLint.LintResult[], ruleIds: string[], filterScript: string): Promise<void> {
    const eslint = createApplySuggestionsESLint(this.baseOptions, results, ruleIds, filterScript);
    const newResults = await eslint.lintFiles(this.config.patterns);
    await ESLint.outputFixes(newResults);
  }
}
