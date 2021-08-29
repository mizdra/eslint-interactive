import { tmpdir } from 'os';
import { join } from 'path';
import { ESLint, Linter, Rule } from 'eslint';
import pager from 'node-pager';
import { format } from './formatter';

function filterResultsByRuleId(results: ESLint.LintResult[], ruleIds: string[]): ESLint.LintResult[] {
  return results.map((result) => {
    return {
      ...result,
      messages: result.messages.filter((message) => message.ruleId !== null && ruleIds.includes(message.ruleId)),
    };
  });
}

function createAddDisableCommentESLint(defaultOptions: ESLint.Options, results: ESLint.LintResult[]): ESLint {
  const eslint = new ESLint({
    ...defaultOptions,
    overrideConfig: {
      rules: {
        // NOTE: add-disable-comment は disable comment を追加してくれる rule。
        // オプションに修正したい message を詰めて渡すと、fix 時にその message を
        // disable するコメントを追加してくれる
        'add-disable-comment': [2, JSON.stringify(results)],
      },
    },
    rulePaths: [...(defaultOptions.rulePaths ?? []), join(__dirname, './rules')],
    // NOTE: add-disable-comment に関するエラーだけ fix したいのでフィルタしている
    fix: (message) => message.ruleId === 'add-disable-comment',
  });
  return eslint;
}

type CachedESLintOptions = {
  rulePaths?: string[];
  extensions?: string[];
};

export class CachedESLint {
  readonly patterns: string[];
  readonly ruleNameToRuleModule: Map<string, Rule.RuleModule>;
  readonly defaultOptions: ESLint.Options;

  constructor(patterns: string[], options?: CachedESLintOptions) {
    this.patterns = patterns;
    const linter = new Linter();
    this.ruleNameToRuleModule = linter.getRules();
    this.defaultOptions = {
      cache: true,
      cacheLocation: join(tmpdir(), `eslint-interactive--${Date.now()}-${Math.random()}`),
      rulePaths: options?.rulePaths,
      extensions: options?.extensions,
    };
  }

  async lint(): Promise<ESLint.LintResult[]> {
    const eslint = new ESLint(this.defaultOptions);
    const results = await eslint.lintFiles(this.patterns);

    return results;
  }

  printResults(results: ESLint.LintResult[]): void {
    const resultText = format(results);
    console.log(resultText);
  }

  async showErrorAndWarningMessages(results: ESLint.LintResult[], ruleIds: string[]): Promise<void> {
    const eslint = new ESLint(this.defaultOptions);
    const formatter = await eslint.loadFormatter('codeframe');
    const resultText = formatter.format(filterResultsByRuleId(results, ruleIds));
    await pager(resultText);
  }

  async fix(ruleIds: string[]): Promise<void> {
    const eslint = new ESLint({
      ...this.defaultOptions,
      fix: (message) => message.ruleId !== null && ruleIds.includes(message.ruleId),
    });

    const results = await eslint.lintFiles(this.patterns);
    await ESLint.outputFixes(results);
  }

  async disable(results: ESLint.LintResult[], ruleIds: string[]): Promise<void> {
    const filteredResults = results.map((result) => {
      const messages = result.messages.filter((message) => message.ruleId && ruleIds.includes(message.ruleId));
      return { ...result, messages };
    });

    const eslint = createAddDisableCommentESLint(this.defaultOptions, filteredResults);
    const newResults = await eslint.lintFiles(this.patterns);
    await ESLint.outputFixes(newResults);
  }
}
