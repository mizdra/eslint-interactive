export type Action = 'showMessages' | 'fix' | 'reselectRules';

export type RuleStatistic = {
  ruleId: string;
  errorCount: number;
  warningCount: number;
  fixableErrorCount: number;
  fixableWarningCount: number;
};
