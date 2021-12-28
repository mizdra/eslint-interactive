import { Linter, Rule, SourceCode } from 'eslint';
import { traverse } from 'estraverse';
import type { Node } from 'estree';
import { TransformContext } from '../types.js';
import { unreachable } from '../util/type-check.js';

export type FixableMaker = (message: Linter.LintMessage, node: Node | null) => Rule.Fix | null | undefined;

export type TransformToMakeFixableAndFixArgs = {
  fixableMaker: FixableMaker;
};

/**
 * Check the node is the source of the message.
 */
function isMessageSourceNode(sourceCode: SourceCode, node: Node, message: Linter.LintMessage): boolean {
  if (message.nodeType === undefined) return false;

  // If `nodeType` is exists, `endLine` and `endColumn` must be exists.
  if (message.endLine === undefined || message.endColumn === undefined) return unreachable();
  // If `nodeType` is exists, `range` must be exists.
  if (node.range === undefined) return unreachable();

  const index = sourceCode.getIndexFromLoc({
    line: message.line,
    // NOTE: `column` of `ESLint.LintMessage` is 1-based, but `column` of `ESTree.Position` is 0-based.
    column: message.column - 1,
  });
  const endIndex = sourceCode.getIndexFromLoc({
    line: message.endLine,
    // NOTE: `column` of `ESLint.LintMessage` is 1-based, but `column` of `ESTree.Position` is 0-based.
    column: message.endColumn - 1,
  });
  const nodeType = message.nodeType;

  return node.range[0] === index && node.range[1] === endIndex && node.type === nodeType;
}

function getMessageToSourceNode(sourceCode: SourceCode, messages: Linter.LintMessage[]): Map<Linter.LintMessage, Node> {
  const result = new Map<Linter.LintMessage, Node>();

  traverse(sourceCode.ast, {
    // Required to traverse extension nodes such as `JSXElement`.
    fallback: 'iteration',
    enter(node: Node) {
      for (const message of messages) {
        if (isMessageSourceNode(sourceCode, node, message)) {
          result.set(message, node);
        }
      }
    },
  });
  return result;
}

function generateFixes(context: TransformContext, args: TransformToMakeFixableAndFixArgs): Rule.Fix[] {
  const messageToNode = getMessageToSourceNode(context.sourceCode, context.messages);

  const fixes: Rule.Fix[] = [];
  for (const message of context.messages) {
    const node = messageToNode.get(message) ?? null;
    const fix = args.fixableMaker(message, node);
    if (fix) fixes.push(fix);
  }
  return fixes;
}

/**
 * Create transform to make fixable and fix.
 */
export function createTransformToMakeFixableAndFix(
  context: TransformContext,
  args: TransformToMakeFixableAndFixArgs,
): Rule.Fix[] {
  return generateFixes(context, args);
}
