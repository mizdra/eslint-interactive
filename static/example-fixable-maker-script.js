// @ts-check

// Edit this file to customize how  you want to convert `Linter.LintMessage` to `Rule.Fix`.
// Save and close this file to run `eslint --fix`.
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
 * A function to convert `Linter.LintMessage` to `Rule.Fix`.
 * @param {import('eslint').Linter.LintMessage} message - The `Linter.LintMessage` to be converted.
 * @param {import('estree').Node | null} node - The node corresponding to the message.
 * @returns {import('eslint').Rule.Fix | null | undefined} The `Rule.Fix` converted from `Linter.LintMessage`. If null or undefined, the message is not fixable.
 */
function fixableMaker(message, node) {
  // example:

  // Edge case handling
  if (!node) return null;
  if (!node.range) return null;

  if (message.ruleId === 'no-unused-vars') {
    if (node.type !== 'Identifier') return null;
    // Add underscores to unused variables
    return {
      range: node.range,
      text: '_' + node.name,
    };
  } else {
    return null;
  }
}

// Here, `fixableMaker` is passed to eslint-interactive pass.
// NOTE: The value evaluated on the last line of the file will be passed to eslint-interactive.
// This is because eslint-interactive evaluates this file with `eval`.
fixableMaker;
