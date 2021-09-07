// @ts-check

// Edit this file to customize how the suggestion is applied.
// Save and close this file to apply the suggestion.
//
// NOTE(For VSCode user):
// In the Restricted Mode of VSCode, the close event of the file is not notified to eslint-interactive.
// Therefore, eslint-interactive will not start applying suggestions even if the file is closed, and eslint-interactive will freeze.
// If you open a file in VSCode Restricted Mode, please follow the steps below:
// 1. Trust the workspace
// 2. Close the open file
// 3. exit the frozen eslint-interactive with Ctrl+C
// 4. Restart eslint-interactive and try to apply the suggestion again

/**
 * A function that takes a list of suggestions that can be applied to a problem as arguments,
 * and selects the suggestion to be applied from the list and returns it.
 * @param {import('eslint').Linter.LintSuggestion[]} suggestions - The list of suggestions that can be applied to the problem
 * @param {import('eslint').Linter.LintMessage} message - The `message` that contained a `suggestion`
 * @param {import('eslint').ESLint.LintResult} result - The `result` that contained the `message`
 * @returns {import('eslint').Linter.LintSuggestion | null | undefined} Suggestion to apply. If null or undefined is returned, do not apply any suggestion.
 */
function filterSuggestions(suggestions, message, result) {
  // example:
  if (message.ruleId === 'no-unsafe-negation') {
    return suggestions.find((suggestion) => suggestion.desc.startsWith('Wrap negation'));
  } else if (message.ruleId === 'no-nonoctal-decimal-escape') {
    if (result.filePath.endsWith('.mjs')) {
      // ref: https://github.com/eslint/eslint/blob/f966fe6286b6f668812f5155b79d4ee2a8b584b3/lib/rules/no-nonoctal-decimal-escape.js#L125
      return suggestions.find((suggestion) => suggestion.messageId === 'escapeBackslash');
    } else {
      return suggestions.find((suggestion) => suggestion.messageId === 'refactor');
    }
  } else {
    // apply first suggestion
    // NOTE: `suggestion.length` must be greater than 0
    return suggestions[0];
  }
}

// Here, `filterSuggestions` is passed to eslint-interactive pass.
// NOTE: The value evaluated on the last line of the file will be passed to eslint-interactive.
// This is because eslint-interactive evaluates this file with `eval`.
filterSuggestions;
