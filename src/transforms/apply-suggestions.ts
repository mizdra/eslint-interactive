import { Linter, Rule } from 'eslint';
import { TransformContext } from '../types';

export type SuggestionFilter = (
  suggestions: Linter.LintSuggestion[],
  message: Linter.LintMessage,
) => Linter.LintSuggestion | null | undefined;

export type TransformToApplySuggestionsArgs = {
  suggestionFilter: SuggestionFilter;
};

function getApplicableSuggestion(
  message: Linter.LintMessage,
  suggestionFilter: SuggestionFilter,
): Linter.LintSuggestion | null {
  if (!message.suggestions || message.suggestions.length === 0) return null;
  const suggestion = suggestionFilter(message.suggestions, message);
  return suggestion ?? null;
}

function generateFixPerMessage(
  _context: TransformContext,
  suggestionFilter: SuggestionFilter,
  message: Linter.LintMessage,
): Rule.Fix | null {
  const suggestion = getApplicableSuggestion(message, suggestionFilter);
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
    const fix = generateFixPerMessage(context, args.suggestionFilter, message);
    if (fix) fixes.push(fix);
  }
  return fixes;
}
