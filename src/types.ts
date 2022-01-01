/**
 * The type that indicates what to do with the problems of selected rules.
 */
export type Action =
  | 'printResultDetails'
  | 'fix'
  | 'disablePerLine'
  | 'disablePerFile'
  | 'applySuggestions'
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
  isFixableCount: number;
  isFixableErrorCount: number;
  isFixableWarningCount: number;
  hasSuggestionsCount: number;
  hasSuggestionsErrorCount: number;
  hasSuggestionsWarningCount: number;
};

/** The config of eslint-interactive */
export type Config = {
  patterns: string[];
  rulePaths?: string[] | undefined;
  extensions?: string[] | undefined;
  formatterName?: string;
  cwd?: string;
};
