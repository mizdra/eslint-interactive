import { Linter, Rule, SourceCode } from 'eslint';
import {
  type FixableMaker,
  type SuggestionFilter,
  type FixToApplySuggestionsArgs,
  type FixToDisablePerFileArgs,
  type FixToDisablePerLineArgs,
  type FixToMakeFixableAndFixArgs,
  type FixToApplyAutoFixesArgs,
  FixToConvertErrorToWarningPerFileArgs,
} from './fix/index.js';
import { preferAdditionShorthandRule } from './prefer-addition-shorthand-rule.js';

export { type FixerOptions, applyFixes } from './fixer.js';
export { type FixableMaker, type SuggestionFilter };

export const eslintInteractivePlugin = {
  rules: {
    // for test
    'prefer-addition-shorthand': preferAdditionShorthandRule,
  },
};

/** For test */
export type FixName =
  | 'applyAutoFixes'
  | 'disablePerLine'
  | 'disablePerFile'
  | 'convertErrorToWarningPerFile'
  | 'applySuggestions'
  | 'makeFixableAndFix';

/** For test */
export type FixArg<T extends FixName> = T extends 'applyAutoFixes'
  ? FixToApplyAutoFixesArgs
  : T extends 'disablePerLine'
  ? FixToDisablePerLineArgs
  : T extends 'disablePerFile'
  ? FixToDisablePerFileArgs
  : T extends 'convertErrorToWarningPerFile'
  ? FixToConvertErrorToWarningPerFileArgs
  : T extends 'applySuggestions'
  ? FixToApplySuggestionsArgs
  : T extends 'makeFixableAndFix'
  ? FixToMakeFixableAndFixArgs
  : never;

/**
 * The type representing the fix to do.
 */
export type Fix =
  | { name: 'applyAutoFixes'; args: FixArg<'applyAutoFixes'> }
  | { name: 'disablePerLine'; args: FixArg<'disablePerLine'> }
  | { name: 'disablePerFile'; args: FixArg<'disablePerFile'> }
  | { name: 'convertErrorToWarningPerFile'; args: FixArg<'convertErrorToWarningPerFile'> }
  | { name: 'applySuggestions'; args: FixArg<'applySuggestions'> }
  | { name: 'makeFixableAndFix'; args: FixArg<'makeFixableAndFix'> };

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
