import { Linter, Rule, SourceCode } from 'eslint';
import { type FixableMaker, type SuggestionFilter } from './fix/index.js';

export { type FixableMaker, type SuggestionFilter };

/**
 * The type representing the additional information for the fix.
 */
export type FixContext = {
  filename: string;
  sourceCode: SourceCode;
  messages: Linter.LintMessage[];
  ruleIds: string[];
  fixer: Rule.RuleFixer;
};

/**
 * The type representing the fix function.
 */
export type FixFunction<T> = (context: FixContext, args: T) => Rule.Fix[];
