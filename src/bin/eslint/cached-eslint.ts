import { join } from 'path';
import { ESLint, Linter, Rule } from 'eslint';

function filterResultsByRuleId(
  results: ESLint.LintResult[],
  ruleIds: string[],
): ESLint.LintResult[] {
  return results.map((result) => {
    return {
      ...result,
      messages: result.messages.filter(
        (message) =>
          message.ruleId !== null && ruleIds.includes(message.ruleId),
      ),
    };
  });
}

export class CachedESLint {
  readonly patterns: string[];
  readonly ruleNameToRuleModule: Map<string, Rule.RuleModule>;
  results: ESLint.LintResult[] | undefined;

  constructor(patterns: string[]) {
    this.patterns = patterns;
    const linter = new Linter();
    this.ruleNameToRuleModule = linter.getRules();
    this.results = undefined;
  }

  async lint(): Promise<ESLint.LintResult[]> {
    if (this.results !== undefined) {
      return this.results;
    }

    const eslint = new ESLint({});
    const results = await eslint.lintFiles(this.patterns);

    return results;
  }

  async loadFormatter(
    nameOrPath?: string | undefined,
  ): Promise<ESLint.Formatter> {
    const eslint = new ESLint({});
    return eslint.loadFormatter(nameOrPath);
  }

  async printResults(results: ESLint.LintResult[]): Promise<void> {
    const eslint = new ESLint({});
    const formatter = await eslint.loadFormatter(
      join(__dirname, '../../formatter'),
    );
    const resultText = formatter.format(results);
    console.log(resultText);
  }

  async formatErrorAndWarningMessages(
    results: ESLint.LintResult[],
    ruleIds: string[],
  ): Promise<string> {
    const eslint = new ESLint({});
    const formatter = await eslint.loadFormatter('stylish');
    const resultText = formatter.format(
      filterResultsByRuleId(results, ruleIds),
    );
    return resultText;
  }

  async fix(ruleIds: string[]): Promise<void> {
    const eslint = new ESLint({
      fix: (message) =>
        message.ruleId !== null && ruleIds.includes(message.ruleId),
    });
    const results = await eslint.lintFiles(this.patterns);
    await ESLint.outputFixes(results);

    this.results = results;
  }
}
