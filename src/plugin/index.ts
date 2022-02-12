import { Linter, Rule, SourceCode } from 'eslint';
import { transformRule, type TransformRuleOption } from './fix-rule.js';
import {
  type FixableMaker,
  type SuggestionFilter,
  type TransformToApplySuggestionsArgs,
  type TransformToDisablePerFileArgs,
  type TransformToDisablePerLineArgs,
  type TransformToMakeFixableAndFixArgs,
} from './fixes/index.js';
import { preferAdditionShorthandRule } from './prefer-addition-shorthand-rule.js';

export { TransformRuleOption, type FixableMaker, type SuggestionFilter };

export const eslintInteractivePlugin = {
  rules: {
    'fix': transformRule,
    // for test
    'prefer-addition-shorthand': preferAdditionShorthandRule,
  },
};

/**
 * The type representing the fix to do.
 */
export type Fix =
  | { name: 'disablePerLine'; args: TransformArg<'disablePerLine'> }
  | { name: 'disablePerFile'; args: TransformArg<'disablePerFile'> }
  | { name: 'applySuggestions'; args: TransformArg<'applySuggestions'> }
  | { name: 'makeFixableAndFix'; args: TransformArg<'makeFixableAndFix'> };

/** For test */
export type TransformName = 'disablePerLine' | 'disablePerFile' | 'applySuggestions' | 'makeFixableAndFix';

/** For test */
export type TransformArg<T extends TransformName> = T extends 'disablePerLine'
  ? TransformToDisablePerLineArgs
  : T extends 'disablePerFile'
  ? TransformToDisablePerFileArgs
  : T extends 'applySuggestions'
  ? TransformToApplySuggestionsArgs
  : T extends 'makeFixableAndFix'
  ? TransformToMakeFixableAndFixArgs
  : never;

/**
 * The type representing the additional information for the fix.
 */
export type TransformContext = {
  filename: string;
  sourceCode: SourceCode;
  messages: Linter.LintMessage[];
  ruleIds: string[];
  fixer: Rule.RuleFixer;
};

/**
 * The type representing the fix function.
 */
export type TransformFunction<T> = (context: TransformContext, args: T) => Rule.Fix[];
