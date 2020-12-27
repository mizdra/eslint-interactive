import { ESLint, Linter, Rule } from 'eslint';
import { printLintSummary } from '../terminal/print-lint-summary';
import { printTable } from '../terminal/print-table';
import { RuleStatistic } from '../types';
import { takeStatisticsForEachRule } from './take-statistics';

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

type LintResult = {
  results: ESLint.LintResult[];
  ruleStatistics: RuleStatistic[];
};

export class CachedESLint {
  readonly patterns: string[];
  readonly ruleNameToRuleModule: Map<string, Rule.RuleModule>;
  results: ESLint.LintResult[] | undefined;
  ruleStatistics: RuleStatistic[] | undefined;

  constructor(patterns: string[]) {
    this.patterns = patterns;
    const linter = new Linter();
    this.ruleNameToRuleModule = linter.getRules();
    this.results = undefined;
    this.ruleStatistics = undefined;
  }

  async lint(): Promise<LintResult> {
    if (this.results !== undefined && this.ruleStatistics !== undefined) {
      return { results: this.results, ruleStatistics: this.ruleStatistics };
    }

    const eslint = new ESLint({});
    const results = await eslint.lintFiles(this.patterns);

    const ruleStatistics = takeStatisticsForEachRule(
      results,
      this.ruleNameToRuleModule,
    );

    return { results, ruleStatistics };
  }

  printStatistics(
    results: ESLint.LintResult[],
    ruleStatistics: RuleStatistic[],
  ): void {
    printLintSummary(results);
    printTable(ruleStatistics);
  }

  async printErrorAndWarningMessages(
    results: ESLint.LintResult[],
    ruleIds: string[],
  ): Promise<void> {
    const eslint = new ESLint({});
    const formatter = await eslint.loadFormatter('stylish');
    const resultText = formatter.format(
      filterResultsByRuleId(results, ruleIds),
    );
    console.log(resultText);
  }

  async fix(ruleIds: string[]): Promise<void> {
    const eslint = new ESLint({
      fix: (message) =>
        message.ruleId !== null && ruleIds.includes(message.ruleId),
    });
    const results = await eslint.lintFiles(this.patterns);
    await ESLint.outputFixes(results);

    const ruleStatistics = takeStatisticsForEachRule(
      results,
      this.ruleNameToRuleModule,
    );

    this.results = results;
    this.ruleStatistics = ruleStatistics;
  }
}
