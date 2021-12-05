import { ESLint, Rule } from 'eslint';
import type { Comment } from 'estree';
import { TransformContext } from '../types';
import { unique } from '../util/array';
import {
  DisableComment,
  findShebang,
  mergeRuleIdsAndDescription,
  parseDisableComment,
  toCommentText,
} from '../util/eslint';
import { notEmpty } from '../util/type-check';

export type TransformToAddDisableCommentPerFileArgs = {
  results: ESLint.LintResult[];
  ruleIds: string[];
  description?: string;
};

function findDisableCommentPerFile(commentsInFile: Comment[]): DisableComment | undefined {
  return commentsInFile.map(parseDisableComment).find((comment) => comment?.scope === 'file');
}

function generateFix(
  context: TransformContext,
  result: ESLint.LintResult,
  ruleIds: string[],
  description?: string,
): Rule.Fix | null {
  const messagesToFix = result.messages.filter((message) => message.ruleId && ruleIds.includes(message.ruleId));

  const ruleIdsToDisable = unique(messagesToFix.map((message) => message.ruleId).filter(notEmpty));
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
export function createTransformToAddDisableCommentPerFile(
  context: TransformContext,
  args: TransformToAddDisableCommentPerFileArgs,
): Rule.Fix[] {
  const result = args.results.find((result) => result.filePath === context.filename);
  if (!result) return [];
  const fix = generateFix(context, result, args.ruleIds, args.description);
  return fix ? [fix] : [];
}
