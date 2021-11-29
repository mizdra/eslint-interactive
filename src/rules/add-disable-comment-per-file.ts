import { ESLint, Rule, SourceCode } from 'eslint';
import type { Comment } from 'estree';
import { unique } from '../util/array';
import {
  toCommentText,
  DisableComment,
  parseDisableComment,
  filterResultsByRuleId,
  mergeRuleIdsAndDescription,
} from '../util/eslint';
import { notEmpty } from '../util/type-check';

const filenameToIsAlreadyFixed = new Map<string, boolean>();

export type AddDisableCommentPerFileOption = { results: ESLint.LintResult[]; ruleIds: string[]; description?: string };

function findDisableCommentPerFile(commentsInFile: Comment[]): DisableComment | undefined {
  return commentsInFile.map(parseDisableComment).find((comment) => comment?.scope === 'file');
}

function generateFix(sourceCode: SourceCode, result: ESLint.LintResult, description?: string): Rule.Fix | null {
  const ruleIdsToDisable = unique(result.messages.map((message) => message.ruleId).filter(notEmpty));
  if (ruleIdsToDisable.length === 0) return null;

  const commentsInFile = sourceCode.getAllComments();
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
    return { range: [0, 0], text };
  }
}

const rule: Rule.RuleModule = {
  meta: {
    fixable: 'code',
  },
  create(context: Rule.RuleContext) {
    const filename = context.getFilename();

    // 🤯🤯🤯 THIS IS SUPER HACK!!! 🤯🤯🤯
    // fix するとコードが変わり、また別の lint エラーが発生する可能性があるため、eslint は `context.report` で
    // 報告されたエラーの fix がすべて終わったら、再び create を呼び出し、また `context.report` で fix 可能なエラーが
    // 報告されないかを確認する仕様になっている (これは `context.report` で fix 可能なものがなくなるまで続く)。
    // そのため、ここでは2回目以降 create が呼び出された時に、誤って再び fix してしまわないよう、fix 済み
    // であれば early return するようにしている。
    const isAlreadyFixed = filenameToIsAlreadyFixed.get(filename) ?? false;
    if (isAlreadyFixed) {
      filenameToIsAlreadyFixed.set(filename, false); // 念の為戻しておく
      return {};
    }

    const { results, ruleIds, description } = context.options[0] as AddDisableCommentPerFileOption;

    const filteredResults = filterResultsByRuleId(results, ruleIds);
    const result = filteredResults.find((result) => result.filePath === filename);
    if (!result) return {};

    const sourceCode = context.getSourceCode();
    const fix = generateFix(sourceCode, result, description);
    if (!fix) return {};

    return {
      // eslint-disable-next-line @typescript-eslint/naming-convention
      Program: () => {
        context.report({
          loc: {
            // エラー位置の指定が必須なので、仕方なく設定する。
            // どうせユーザにはエラーメッセージを見せることはないので、適当に設定しておく。
            line: 0,
            column: 0,
          },
          message: `add-disable-comment-per-line`,
          fix: () => fix,
        });
        filenameToIsAlreadyFixed.set(filename, true);
      },
    };
  },
};

module.exports = rule; // for ESLint's Node.js API
// eslint-disable-next-line import/no-default-export
export default rule; // for test
