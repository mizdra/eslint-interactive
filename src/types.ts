import { Linter, Rule, SourceCode } from 'eslint';
import { SelectActionArgs } from './scenes/select-action';
import { SelectRuleIdsArgs } from './scenes/select-rule-ids';
import { TransformToApplySuggestionsArgs } from './transforms/apply-suggestions';
import { TransformToDisablePerFileArgs } from './transforms/disable-per-file';
import { TransformToDisablePerLineArgs } from './transforms/disable-per-line';

/**
 * The type that indicates what to do with the problems of selected rules.
 */
export type Action =
  | 'displayMessages'
  | 'fix'
  | 'disablePerLine'
  | 'disablePerFile'
  | 'ApplySuggestions'
  | 'reselectRules';

/**
 * The type representing how to display the lint results.
 *
 * `withPager` means that the lint results will be displayed with a pager (like `less` command).
 * `withoutPager` means that the lint results will be displayed without a pager.
 */
export type DisplayMode = 'withPager' | 'withoutPager';

/**
 * The type representing the lint results of a rule unit.
 */
export type RuleStatistic = {
  ruleId: string;
  errorCount: number;
  warningCount: number;
  fixableErrorCount: number;
  fixableWarningCount: number;
  suggestApplicableErrorCount: number;
  suggestApplicableWarningCount: number;
};

/**
 * The return type when calling a scene function.
 * Indicates which scene to jump to next.
 */
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

/**
 * The type representing the transform to do.
 */
export type Transform =
  | { name: 'disablePerLine'; args: TransformToDisablePerLineArgs }
  | { name: 'disablePerFile'; args: TransformToDisablePerFileArgs }
  | { name: 'applySuggestions'; args: TransformToApplySuggestionsArgs };

/**
 * The type representing the additional information for the transform.
 */
export type TransformContext = {
  filename: string;
  sourceCode: SourceCode;
  messages: Linter.LintMessage[];
  ruleIds: string[];
};

/**
 * The type representing the transform function.
 */
export type TransformFunction<T> = (context: TransformContext, args: T) => Rule.Fix[];
