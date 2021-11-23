import { SelectActionArgs } from './scenes/select-action';
import { SelectRuleIdsArgs } from './scenes/select-rule-ids';

export type Action = 'displayMessages' | 'fix' | 'disable' | 'applySuggestion' | 'reselectRules';
export type DisplayMode = 'withPager' | 'withoutPager';

export type RuleStatistic = {
  ruleId: string;
  errorCount: number;
  warningCount: number;
  fixableErrorCount: number;
  fixableWarningCount: number;
  suggestApplicableErrorCount: number;
  suggestApplicableWarningCount: number;
};

export type NextScene =
  | { name: 'showLintResults' }
  | { name: 'selectRuleIds'; args: SelectRuleIdsArgs }
  | { name: 'selectAction'; args: SelectActionArgs }
  | { name: 'selectToContinue' }
  | { name: 'exit' };
