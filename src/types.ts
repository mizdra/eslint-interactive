import { ESLint, Rule } from 'eslint';

export type Answers = {
  ruleIds: string[];
  action: 'showMessages' | 'fix';
};

export type Statistics = {
  results: ESLint.LintResult[];
  ruleStatistics: RuleStatistic[];
};

export type RuleStatistic = {
  ruleId: string;
  ruleModule: Rule.RuleModule | undefined;
  errorCount: number;
  warningCount: number;
  fixableErrorCount: number;
  fixableWarningCount: number;
};

export type Choice = {
  name: string;
  message: string;
};
