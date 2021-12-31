import { Rule } from 'eslint';
import type { Comment } from 'estree';
import { TransformContext } from '../../types.js';
import { unique } from '../../util/array.js';
import {
  DisableComment,
  findShebang,
  mergeRuleIdsAndDescription,
  parseDisableComment,
  toCommentText,
} from '../../util/eslint.js';
import { notEmpty } from '../../util/type-check.js';

export type TransformToDisablePerFileArgs = {
  description?: string;
};

function findDisableCommentPerFile(commentsInFile: Comment[]): DisableComment | undefined {
  return commentsInFile.map(parseDisableComment).find((comment) => comment?.scope === 'file');
}

function generateFix(context: TransformContext, description?: string): Rule.Fix | null {
  const ruleIdsToDisable = unique(context.messages.map((message) => message.ruleId).filter(notEmpty));
  if (ruleIdsToDisable.length === 0) return null;

  const commentsInFile = context.sourceCode.getAllComments();
  const disableCommentPerFile = findDisableCommentPerFile(commentsInFile);
  if (disableCommentPerFile) {
    const text = toCommentText({
      type: 'Block',
      scope: 'file',
      ...mergeRuleIdsAndDescription(disableCommentPerFile, {
        ruleIds: ruleIdsToDisable,
        description,
      }),
    });
    return { range: disableCommentPerFile.range, text };
  } else {
    const text = toCommentText({ type: 'Block', scope: 'file', ruleIds: ruleIdsToDisable, description }) + '\n';

    const shebang = findShebang(context.sourceCode.text);
    // if shebang exists, insert comment after shebang
    return { range: shebang ? [shebang.range[1], shebang.range[1]] : [0, 0], text };
  }
}

/**
 * Create transform to add disable comment per file.
 */
export function createTransformToDisablePerFile(
  context: TransformContext,
  args: TransformToDisablePerFileArgs,
): Rule.Fix[] {
  const fix = generateFix(context, args.description);
  return fix ? [fix] : [];
}
