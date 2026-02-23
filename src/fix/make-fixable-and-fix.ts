import type { AST, Linter, Rule, SourceCode } from 'eslint';
import type { FixContext } from './index.js';

export type FixableMaker = (
  message: Linter.LintMessage,
  range: AST.Range,
  context: FixContext,
) => Rule.Fix | null | undefined;

export type FixToMakeFixableAndFixArgs = {
  fixableMaker: FixableMaker;
};

function getMessageRange(sourceCode: SourceCode, message: Linter.LintMessage): AST.Range {
  const index = sourceCode.getIndexFromLoc({
    line: message.line,
    // NOTE: `column` of `ESLint.LintMessage` is 1-based, but `column` of `ESTree.Position` is 0-based.
    column: message.column - 1,
  });
  if (message.endLine && message.endColumn) {
    const endIndex = sourceCode.getIndexFromLoc({
      line: message.endLine,
      // NOTE: `column` of `ESLint.LintMessage` is 1-based, but `column` of `ESTree.Position` is 0-based.
      column: message.endColumn - 1,
    });
    return [index, endIndex];
  } else {
    return [index, index];
  }
}

function generateFixes(context: FixContext, args: FixToMakeFixableAndFixArgs): Rule.Fix[] {
  const fixes: Rule.Fix[] = [];
  for (const message of context.messages) {
    const range = getMessageRange(context.sourceCode, message);
    const fix = args.fixableMaker(message, range, context);
    if (fix) fixes.push(fix);
  }
  return fixes;
}

/**
 * Create fix to make fixable and fix.
 */
export function createFixToMakeFixableAndFix(context: FixContext, args: FixToMakeFixableAndFixArgs): Rule.Fix[] {
  return generateFixes(context, args);
}
