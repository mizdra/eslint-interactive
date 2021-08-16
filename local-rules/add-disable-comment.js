// @ts-check

const ESLINT_DISABLE_COMMENT_HEADER = 'eslint-disable-next-line ';

// NOTE: disable comment を追加してくれる rule。
// オプションに修正したい message を詰めて渡すと、fix 時にその message を
// disable するコメントを追加してくれる。
//
// 様々なスーパーハックを駆使して成り立っている、このライブラリの観光名所。
// 作りも粗く、いくつかのエッジケースで正しくコメントを追加できない問題がある。
// しかしユースケースの大部分をカバーできるため、あえてこのような作りにしている。

/** @type {Map<string, boolean>} */
const filenameToIsAlreadyFixed = new Map();

function unique(array) {
  return [...new Set(array)];
}

function groupBy(array, toKey) {
  const map = new Map();

  for (const item of array) {
    const key = toKey(item);
    const oldValue = map.get(key);
    const newValue = oldValue ? [...oldValue, item] : [item];
    map.set(key, newValue);
  }

  return map;
}

/**
 * @param commentsInFile {import('estree').Comment[]}
 * @param line {number}
 */
function findESLintDisableComment(commentsInFile, line) {
  const commentsInPreviousLine = commentsInFile.filter((comment) => comment.loc.start.line === line - 1);
  const eslintDisableComment = commentsInPreviousLine.find((comment) => {
    const text = comment.value.trim();
    return text.startsWith(ESLINT_DISABLE_COMMENT_HEADER);
  });
  if (!eslintDisableComment) return;

  const disabledRules = eslintDisableComment.value
    .trim()
    .slice(ESLINT_DISABLE_COMMENT_HEADER.length)
    // NOTE: ',' 区切りで無効化したいルールが複数記述されることがある
    .split(',')
    // NOTE: 'a,b, c,  d' のようなカンマの後に空白があるケースもパースできるように
    .map((r) => r.trim());

  // 無効化されるルールのリストの末尾のインデックスを計算する
  const commentTextTrailingSpaceLength =
    eslintDisableComment.value.length - eslintDisableComment.value.trimEnd().length;
  const commentFooterLength = eslintDisableComment.type === 'Block' ? 2 : 0; // '*/' の長さ
  const disableRuleListEnd = eslintDisableComment.range[1] - commentFooterLength - commentTextTrailingSpaceLength;
  return { disabledRules, disableRuleListEnd };
}

/** @type {import('eslint').Rule.RuleModule} */
module.exports = {
  create(context) {
    /** @type {import('eslint').ESLint.LintResult[]} */
    const results = JSON.parse(context.options[0]);

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

    const result = results.find((result) => result.filePath === filename);
    if (!result) return {};

    /** @type {Map<number, import('eslint').Linter.LintMessage[]>} */
    const messagesByLine = groupBy(result.messages, (message) => message.line);

    const sourceCode = context.getSourceCode();
    const commentsInFile = sourceCode.getAllComments();

    return {
      // eslint-disable-next-line @typescript-eslint/naming-convention
      Program: () => {
        // 🤯🤯🤯 THIS IS SUPER HACK!!! 🤯🤯🤯
        // 1つ message を修正する度に、disable comment が 1 行追加されて、message に格納されている位置情報と、本来修正するべきコードの位置が
        // 1行ずれてしまう。そこで、ファイルの後ろ側の行の message から修正していくことで、message の位置情報と本来修正するべきコードの
        // 位置情報がずれないようにしている。
        const entries = Array.from(messagesByLine.entries()).reverse();
        for (const [line, messages] of entries) {
          const ruleIds = unique(messages.map((message) => message.ruleId));
          context.report({
            loc: {
              // エラー位置の指定が必須なので、仕方なく設定する。
              // どうせユーザにはエラーメッセージを見せることはないので、適当に設定しておく。
              line: line,
              column: 0,
            },
            message: `add-disable-comment for ${ruleIds.join(', ')}`,
            fix: createFix(line, ruleIds),
          });
        }
        filenameToIsAlreadyFixed.set(filename, true);
      },
    };

    /**
     * @param {number} line
     * @param {string[]} ruleIds
     * @returns {(fixer: import('eslint').Rule.RuleFixer) => import('eslint').Rule.Fix}
     */
    function createFix(line, ruleIds) {
      return (fixer) => {
        const disableComment = findESLintDisableComment(commentsInFile, line);

        if (!disableComment) {
          const headNodeIndex = sourceCode.getIndexFromLoc({ line: line, column: 0 });
          const headNode = sourceCode.getNodeByRangeIndex(headNodeIndex);
          if (headNode === null) return; // なんか null になることがあるらしいので、null になったら例外ケースとして無視する
          // @ts-ignore
          if (headNode.type === 'JSXText') {
            return fixer.insertTextBeforeRange(
              [headNodeIndex, 0],
              `{/* eslint-disable-next-line ${ruleIds.join(', ')} */}\n`,
            );
          } else {
            return fixer.insertTextBeforeRange(
              [headNodeIndex, 0],
              `// eslint-disable-next-line ${ruleIds.join(', ')}\n`,
            );
          }
        } else {
          return fixer.insertTextBeforeRange([disableComment.disableRuleListEnd, 0], `, ${ruleIds.join(', ')}`);
        }
      };
    }
  },
};
