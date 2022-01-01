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
