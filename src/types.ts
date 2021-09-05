export type Action = 'showMessages' | 'fix' | 'reselectRules';
export type DisplayMode = 'withPager' | 'withoutPager';

export type RuleStatistic = {
  ruleId: string;
  errorCount: number;
  warningCount: number;
  fixableErrorCount: number;
  fixableWarningCount: number;
};
