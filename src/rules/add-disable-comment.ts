import { Rule } from 'eslint';
// eslint-disable-next-line import/no-unresolved
import type { Comment } from 'estree';
import { createCommentNodeText, parseCommentAsESLintDisableComment } from '../util/comment';

// disable comment を追加してくれる rule。
// disable comment を追加したい場所と disable したい ruleId の情報をオプションで渡すと、
// autofix で disable comment を追加してくれる。
//
// NOTE: 様々なスーパーハックを駆使して成り立っている、このライブラリの観光名所。
// 作りも粗く、いくつかのエッジケースで正しくコメントを追加できない問題がある。
// しかしユースケースの大部分をカバーできるため、あえてこのような作りにしている。
//
// NOTE: ESLint の autofix ではなく、jscodeshift を使って disable comment を追加する
// 方法もある (事例: https://github.com/amanda-mitchell/suppress-eslint-errors )。
// jscodeshift は ESLint とは異なるパーサを用いてコードをパースする。そのため jscodeshift を使って
// disable comment の追加をするには、jscodeshift 向けに別途利用するパーサを指定する必要があったり、
// ESLint と jscodeshift のパーサの実装の違いによりパースが上手く行かない可能性がある。
// そこで eslint-interactive では jscodeshift を使わず、ESLint の autofix で disable comment を
// 追加することで、既にユーザが .eslintrc などで指定しているパーサをそのまま利用して上記問題を回避している。

const filenameToIsAlreadyFixed = new Map<string, boolean>();

export type DisableTarget = {
  filename: string;
  line: number;
  ruleIds: string[];
};
export type AddDisableCommentOption = { targets: DisableTarget[]; description?: string };

function findESLintDisableComment(commentsInFile: Comment[], line: number) {
  const commentsInPreviousLine = commentsInFile.filter((comment) => comment.loc?.start.line === line - 1);

  for (const comment of commentsInPreviousLine) {
    const eslintDisableComment = parseCommentAsESLintDisableComment(comment);
    // NOTE: コメントノードには必ず range があるはずだが、型上は optional なので、
    // range がない場合は無視するようにしておく
    if (eslintDisableComment && comment.range) {
      return {
        eslintDisableComment,
        range: comment.range,
      };
    }
  }
  return null;
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

    const option = context.options[0] as AddDisableCommentOption;
    const targetsInFile = option.targets.filter((target) => target.filename === filename);
    if (targetsInFile.length === 0) return {};

    // 🤯🤯🤯 THIS IS SUPER HACK!!! 🤯🤯🤯
    // 1つ message を修正する度に、disable comment が 1 行追加されて、message に格納されている位置情報と、本来修正するべきコードの位置が
    // 1行ずれてしまう。そこで、ファイルの後ろ側の行の message から修正していくことで、message の位置情報と本来修正するべきコードの
    // 位置情報がずれないようにしている。
    const sortedTargetsInFile = targetsInFile.sort((a, b) => b.line - a.line);

    const sourceCode = context.getSourceCode();
    const commentsInFile = sourceCode.getAllComments();

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
          message: `add-disable-comment`,
          fix: (fixer) => {
            const results: Rule.Fix[] = [];
            for (const { line, ruleIds } of sortedTargetsInFile) {
              const result = addDisableComment(fixer, line, ruleIds);
              if (result) results.push(result);
            }
            return results;
          },
        });
        filenameToIsAlreadyFixed.set(filename, true);
      },
    };

    function addDisableComment(fixer: Rule.RuleFixer, line: number, ruleIds: string[]): Rule.Fix | null {
      const findResult = findESLintDisableComment(commentsInFile, line);

      if (!findResult) {
        const headNodeIndex = sourceCode.getIndexFromLoc({ line: line, column: 0 });
        const headNode = sourceCode.getNodeByRangeIndex(headNodeIndex);
        if (headNode === null) return null; // なんか null になることがあるらしいので、null になったら例外ケースとして無視する
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        if ((headNode.type as any) === 'JSXText') {
          return fixer.insertTextBeforeRange(
            [headNodeIndex, 0],
            '{' + createCommentNodeText({ type: 'Block', ruleIds, description: option.description }) + '}\n',
          );
        } else {
          return fixer.insertTextBeforeRange(
            [headNodeIndex, 0],
            createCommentNodeText({ type: 'Line', ruleIds, description: option.description }) + '\n',
          );
        }
      } else {
        const { range, eslintDisableComment } = findResult;
        const description =
          eslintDisableComment.description !== undefined && option.description !== undefined
            ? `${eslintDisableComment.description}, ${option.description}`
            : eslintDisableComment.description !== undefined && option.description === undefined
            ? eslintDisableComment.description
            : eslintDisableComment.description === undefined && option.description !== undefined
            ? option.description
            : undefined;
        return fixer.replaceTextRange(
          range,
          createCommentNodeText({
            type: eslintDisableComment.type,
            ruleIds: [...eslintDisableComment.ruleIds, ...ruleIds],
            description,
          }),
        );
      }
    }
  },
};

module.exports = rule; // for ESLint's Node.js API
// eslint-disable-next-line import/no-default-export
export default rule; // for test
