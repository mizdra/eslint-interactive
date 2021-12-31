import { Linter, Rule } from 'eslint';
import { TransformContext } from '../../types.js';

export type SuggestionFilter = (
  suggestions: Linter.LintSuggestion[],
  message: Linter.LintMessage,
) => Linter.LintSuggestion | null | undefined;

export type TransformToApplySuggestionsArgs = {
  filter: SuggestionFilter;
};

function getApplicableSuggestion(message: Linter.LintMessage, filter: SuggestionFilter): Linter.LintSuggestion | null {
  if (!message.suggestions || message.suggestions.length === 0) return null;
  const suggestion = filter(message.suggestions, message);
  return suggestion ?? null;
}

function generateFixPerMessage(
  _context: TransformContext,
  filter: SuggestionFilter,
  message: Linter.LintMessage,
): Rule.Fix | null {
  const suggestion = getApplicableSuggestion(message, filter);
  if (!suggestion) return null;
  return suggestion.fix;
}

/**
 * Create transform to apply suggestions.
 */
export function createTransformToApplySuggestions(
  context: TransformContext,
  args: TransformToApplySuggestionsArgs,
): Rule.Fix[] {
  const fixes = [];
  for (const message of context.messages) {
    const fix = generateFixPerMessage(context, args.filter, message);
    if (fix) fixes.push(fix);
  }
  return fixes;
}
