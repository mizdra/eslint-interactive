import { tmpdir } from 'os';
import { join } from 'path';
import { ESLint } from 'eslint';
import pager from 'node-pager';
import { format } from './formatter';
import { DisableTarget, Option } from './rules/add-disable-comment';
import { ApplySuggestionOption } from './rules/apply-suggestion';
import { DisplayMode } from './types';
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

function generateAddDisableCommentOption(results: ESLint.LintResult[], description?: string): Option {
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

function createApplySuggestionESLint(
  defaultOptions: ESLint.Options,
  results: ESLint.LintResult[],
  ruleIds: string[],
  filterScript: string,
): ESLint {
  const eslint = new ESLint({
    ...defaultOptions,
    overrideConfig: {
      rules: {
        'apply-suggestion': [2, { results, ruleIds, filterScript } as ApplySuggestionOption],
      },
    },
    rulePaths: [...(defaultOptions.rulePaths ?? []), join(__dirname, 'rules')],
    // NOTE: apply-suggestion に関するエラーだけ fix したいのでフィルタしている
    fix: (message) => message.ruleId === 'apply-suggestion',
  });
  return eslint;
}
type CachedESLintOptions = {
  rulePaths?: string[];
  extensions?: string[];
  formatterName?: string;
};

export class CachedESLint {
  readonly patterns: string[];
  readonly defaultOptions: ESLint.Options;
  readonly formatterName: string | undefined;

  constructor(patterns: string[], options?: CachedESLintOptions) {
    this.patterns = patterns;
    this.defaultOptions = {
      cache: true,
      cacheLocation: join(tmpdir(), `eslint-interactive--${Date.now()}-${Math.random()}`),
      rulePaths: options?.rulePaths,
      extensions: options?.extensions,
    };
    this.formatterName = options?.formatterName;
  }

  async lint(): Promise<ESLint.LintResult[]> {
    const eslint = new ESLint(this.defaultOptions);
    const results = await eslint.lintFiles(this.patterns);

    return results;
  }

  printResults(results: ESLint.LintResult[]): void {
    // get used plugins from `results`
    const plugins = scanUsedPluginsFromResults(results);

    // get `rulesMeta` from `results`
    const eslint = new ESLint({
      ...this.defaultOptions,
      overrideConfig: { plugins },
    });
    // NOTE: `getRulesMetaForResults` is a feature added in ESLint 7.29.0.
    // Therefore, the function may not exist in versions lower than 7.29.0.
    const rulesMeta: ESLint.LintResultData['rulesMeta'] = eslint.getRulesMetaForResults?.(results) ?? {};

    const resultText = format(results, { rulesMeta: rulesMeta });
    console.log(resultText);
  }

  async showProblems(displayMode: DisplayMode, results: ESLint.LintResult[], ruleIds: string[]): Promise<void> {
    const eslint = new ESLint(this.defaultOptions);
    const formatter = await eslint.loadFormatter(this.formatterName);
    const resultText = formatter.format(filterResultsByRuleId(results, ruleIds));
    if (displayMode === 'withPager') {
      await pager(resultText);
    } else {
      console.log(resultText);
    }
  }

  async fix(ruleIds: string[]): Promise<void> {
    const eslint = new ESLint({
      ...this.defaultOptions,
      fix: (message) => message.ruleId !== null && ruleIds.includes(message.ruleId),
    });

    const results = await eslint.lintFiles(this.patterns);
    await ESLint.outputFixes(results);
  }

  async disable(results: ESLint.LintResult[], ruleIds: string[], description?: string): Promise<void> {
    const filteredResults = results.map((result) => {
      const messages = result.messages.filter((message) => message.ruleId && ruleIds.includes(message.ruleId));
      return { ...result, messages };
    });

    const eslint = createAddDisableCommentESLint(this.defaultOptions, filteredResults, description);
    const newResults = await eslint.lintFiles(this.patterns);
    await ESLint.outputFixes(newResults);
  }

  async applySuggestion(results: ESLint.LintResult[], ruleIds: string[], filterScript: string): Promise<void> {
    const eslint = createApplySuggestionESLint(this.defaultOptions, results, ruleIds, filterScript);
    const newResults = await eslint.lintFiles(this.patterns);
    await ESLint.outputFixes(newResults);
  }
}
