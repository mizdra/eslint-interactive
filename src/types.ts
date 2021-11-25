import { SelectActionArgs } from './scenes/select-action';
import { SelectRuleIdsArgs } from './scenes/select-rule-ids';

export type Action = 'displayMessages' | 'fix' | 'disable' | 'ApplySuggestions' | 'reselectRules';
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

/** The config of eslint-interactive */
export type Config = {
  patterns: string[];
  rulePaths: string[] | undefined;
  extensions: string[] | undefined;
  formatterName: string;
};
