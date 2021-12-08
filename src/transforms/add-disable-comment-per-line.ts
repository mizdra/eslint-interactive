import { Linter, Rule } from 'eslint';
import type { Comment } from 'estree';
import { TransformContext } from '../types';
import { groupBy, unique } from '../util/array';
import { DisableComment, mergeRuleIdsAndDescription, parseDisableComment, toCommentText } from '../util/eslint';
import { notEmpty } from '../util/type-check';

export type TransformToAddDisableCommentPerLineArgs = {
  description?: string;
};

function findDisableCommentPerLine(commentsInFile: Comment[], line: number): DisableComment | undefined {
  const commentsInPreviousLine = commentsInFile.filter((comment) => comment.loc?.start.line === line - 1);
  return commentsInPreviousLine.map(parseDisableComment).find((comment) => comment?.scope === 'next-line');
}

function generateFixPerLine(
  context: TransformContext,
  description: string | undefined,
  line: number,
  messagesInLine: Linter.LintMessage[],
): Rule.Fix | null {
  const ruleIdsToDisable = unique(messagesInLine.map((message) => message.ruleId).filter(notEmpty));
  if (ruleIdsToDisable.length === 0) return null;

  const commentsInFile = context.sourceCode.getAllComments();
  const disableCommentPerLine = findDisableCommentPerLine(commentsInFile, line);
  if (disableCommentPerLine) {
    const text = toCommentText({
      type: 'Block',
      scope: 'next-line',
      ...mergeRuleIdsAndDescription(disableCommentPerLine, {
        ruleIds: ruleIdsToDisable,
        description,
      }),
    });
    return { range: disableCommentPerLine.range, text };
  } else {
    const headNodeIndex = context.sourceCode.getIndexFromLoc({ line: line, column: 0 });
    const headNode = context.sourceCode.getNodeByRangeIndex(headNodeIndex);
    if (headNode === null) return null; // For some reason, it seems to be null sometimes.

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    if ((headNode.type as any) === 'JSXText') {
      const commentText = toCommentText({ type: 'Block', scope: 'next-line', ruleIds: ruleIdsToDisable, description });
      return {
        range: [headNodeIndex, headNodeIndex],
        text: '{' + commentText + '}\n',
      };
    } else {
      const commentText = toCommentText({ type: 'Line', scope: 'next-line', ruleIds: ruleIdsToDisable, description });
      return {
        range: [headNodeIndex, headNodeIndex],
        text: commentText + '\n',
      };
    }
  }
}

/**
 * Create transform to add disable comment per line.
 */
export function createTransformToAddDisableCommentPerLine(
  context: TransformContext,
  args: TransformToAddDisableCommentPerLineArgs,
): Rule.Fix[] {
  const lineToMessages = groupBy(context.messages, (message) => message.line);
  const fixes = [];
  for (const [line, messagesInLine] of lineToMessages) {
    const fix = generateFixPerLine(context, args.description, line, messagesInLine);
    if (fix) fixes.push(fix);
  }
  return fixes;
}
