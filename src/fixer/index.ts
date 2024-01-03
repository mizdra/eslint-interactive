import { Linter, Rule, SourceCode } from 'eslint';

export { type FixableMaker, type SuggestionFilter } from './fix/index.js';
export {
  createFixToApplyAutoFixes,
  createFixToDisablePerLine,
  createFixToDisablePerFile,
  createFixToConvertErrorToWarningPerFile,
  createFixToApplySuggestions,
  createFixToMakeFixableAndFix,
} from './fix/index.js';
export { verifyAndFix } from '../eslint/linter.js';

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
