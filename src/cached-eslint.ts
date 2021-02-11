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

type CachedESLintOptions = {
  rulePaths?: string[];
};

export class CachedESLint {
  readonly patterns: string[];
  readonly ruleNameToRuleModule: Map<string, Rule.RuleModule>;
  readonly defaultOptions: ESLint.Options;

  constructor(patterns: string[], options: CachedESLintOptions) {
    this.patterns = patterns;
    const linter = new Linter();
    this.ruleNameToRuleModule = linter.getRules();
    this.defaultOptions = {
      cache: true,
      cacheLocation: join(tmpdir(), `eslint-interactive--${Date.now()}-${Math.random()}`),
      rulePaths: options.rulePaths,
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
}
