import { Rule } from 'eslint';
import type { Comment } from 'estree';
import { unique } from '../../util/array.js';
import {
  DisableComment,
  findShebang,
  mergeRuleIdsAndDescription,
  parseDisableComment,
  toCommentText,
} from '../../util/eslint.js';
import { notEmpty } from '../../util/type-check.js';
import { FixContext } from '../index.js';

export type FixToDisablePerFileArgs = {
  description?: string;
};

function findDisableCommentPerFile(commentsInFile: Comment[]): DisableComment | undefined {
  return commentsInFile.map(parseDisableComment).find((comment) => comment?.scope === 'file');
}

function generateFix(context: FixContext, description?: string): Rule.Fix | null {
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
    return context.fixer.replaceTextRange(disableCommentPerFile.range, text);
  } else {
    const text = `${toCommentText({ type: 'Block', scope: 'file', ruleIds: ruleIdsToDisable, description })}\n`;

    const shebang = findShebang(context.sourceCode.text);
    // if shebang exists, insert comment after shebang
    return context.fixer.insertTextAfterRange(shebang?.range ?? [0, 0], text);
  }
}

/**
 * Create fix to add disable comment per file.
 */
export function createFixToDisablePerFile(context: FixContext, args: FixToDisablePerFileArgs): Rule.Fix[] {
  const fix = generateFix(context, args.description);
  return fix ? [fix] : [];
}
