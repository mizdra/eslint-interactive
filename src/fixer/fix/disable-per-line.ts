import { Linter, Rule, SourceCode } from 'eslint';
import { DescriptionPosition } from 'src/cli/prompt.js';
import { mergeFixes } from '../../eslint/report-translator.js';
import { groupBy, unique } from '../../util/array.js';
import {
  DisableComment,
  insertDescriptionCommentStatementBeforeLine,
  insertDisableCommentStatementBeforeLine,
  mergeDescription,
  mergeRuleIds,
  parseDisableComment,
  updateDisableComment,
} from '../../util/eslint.js';
import { notEmpty } from '../../util/type-check.js';
import { FixContext } from '../index.js';

export type FixToDisablePerLineArgs = {
  description?: string | undefined;
  descriptionPosition?: DescriptionPosition | undefined;
};

function findDisableCommentPerLine(sourceCode: SourceCode, line: number): DisableComment | undefined {
  const commentsInFile = sourceCode.getAllComments();
  const commentsInPreviousLine = commentsInFile.filter((comment) => comment.loc?.start.line === line - 1);
  return commentsInPreviousLine.map(parseDisableComment).find((comment) => comment?.scope === 'next-line');
}

function generateFixesPerLine(
  context: FixContext,
  description: string | undefined,
  descriptionPosition: DescriptionPosition | undefined,
  line: number,
  messagesInLine: Linter.LintMessage[],
): Rule.Fix | null {
  const { fixer, sourceCode } = context;

  const ruleIdsToDisable = unique(messagesInLine.map((message) => message.ruleId).filter(notEmpty));
  if (ruleIdsToDisable.length === 0) return null;

  const disableCommentPerLine = findDisableCommentPerLine(sourceCode, line);

  const fixes: Rule.Fix[] = [];
  const isPreviousLine = description !== undefined && descriptionPosition === 'previousLine';

  if (isPreviousLine) {
    fixes.push(
      insertDescriptionCommentStatementBeforeLine({
        fixer,
        sourceCode,
        line: disableCommentPerLine ? disableCommentPerLine.loc.start.line : line,
        description,
      }),
    );
  }
  if (disableCommentPerLine) {
    fixes.push(
      updateDisableComment({
        fixer,
        disableComment: disableCommentPerLine,
        newRules: mergeRuleIds(disableCommentPerLine.ruleIds, ruleIdsToDisable),
        newDescription: isPreviousLine
          ? disableCommentPerLine.description
          : mergeDescription(disableCommentPerLine.description, description),
      }),
    );
  } else {
    fixes.push(
      insertDisableCommentStatementBeforeLine({
        fixer,
        sourceCode,
        line,
        scope: 'next-line',
        ruleIds: ruleIdsToDisable,
        description: isPreviousLine ? undefined : description,
      }),
    );
  }
  return mergeFixes(fixes, context.sourceCode);
}

/**
 * Create fix to add disable comment per line.
 */
export function createFixToDisablePerLine(context: FixContext, args: FixToDisablePerLineArgs): Rule.Fix[] {
  const lineToMessages = groupBy(context.messages, (message) => message.line);
  const fixes: Rule.Fix[] = [];
  for (const [line, messagesInLine] of lineToMessages) {
    const fix = generateFixesPerLine(context, args.description, args.descriptionPosition, line, messagesInLine);
    if (fix) fixes.push(fix);
  }
  return fixes;
}
