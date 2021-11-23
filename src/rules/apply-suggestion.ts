import { Rule, Linter, ESLint } from 'eslint';
import { notEmpty } from '../util/filter';

export type ApplySuggestionOption = { results: ESLint.LintResult[]; ruleIds: string[]; filterScript: string };

type SuggestionFilter = (
  suggestions: Linter.LintSuggestion[],
  message: Linter.LintMessage,
  result: ESLint.LintResult,
) => Linter.LintSuggestion | null | undefined;

// function filterSuggestion(
//   suggestions: Linter.LintSuggestion[],
//   _message: Linter.LintMessage,
//   _result: ESLint.LintResult,
// ): Linter.LintSuggestion | null {
//   // NOTE: ひとまず複数 suggestion がある場合は先頭の 1 つを適用することに
//   return suggestions[0];
// }

function getApplicableSuggestion(
  message: Linter.LintMessage,
  result: ESLint.LintResult,
  filter: SuggestionFilter,
): Linter.LintSuggestion | null | undefined {
  if (!message.suggestions || message.suggestions.length === 0) return null;
  const suggestion = filter(message.suggestions, message, result);
  return suggestion;
}

function applySuggestion(fixer: Rule.RuleFixer, suggestion: Linter.LintSuggestion): Rule.Fix {
  return fixer.replaceTextRange(suggestion.fix.range, suggestion.fix.text);
}

const filenameToIsAlreadyFixed = new Map<string, boolean>();

const rule: Rule.RuleModule = {
  meta: {
    fixable: 'code',
  },
  create(context: Rule.RuleContext) {
    const filename = context.getFilename();

    const option = context.options[0] as ApplySuggestionOption;

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

    // fix 対象のファイルの result のみ取り出す
    // NOTE: 同じ filename を持つ result が複数存在することは無いはずなので、`Array#find` で取り出している
    const result = option.results.find((result) => result.filePath === filename);
    if (!result) return {};

    const messages = result.messages
      // ruleIds オプションで指定されたルールに関する message のみにフィルタする
      .filter((message) => message.ruleId && option.ruleIds.includes(message.ruleId))
      // 🤯🤯🤯 THIS IS SUPER HACK!!! 🤯🤯🤯
      // 1つ message を修正する度に、disable comment が 1 行追加されて、message に格納されている位置情報と、本来修正するべきコードの位置が
      // 1行ずれてしまう。そこで、ファイルの後ろ側の行の message から修正していくことで、message の位置情報と本来修正するべきコードの
      // 位置情報がずれないようにしている。
      .sort((a, b) => b.line - a.line || b.column - a.column);
    if (messages.length === 0) return {};

    const filter: SuggestionFilter = eval(option.filterScript);

    const suggestions = messages.map((message) => getApplicableSuggestion(message, result, filter)).filter(notEmpty);
    if (suggestions.length === 0) return {};

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
          message: `apply-suggestion`,
          fix: (fixer) => {
            const fixes: Rule.Fix[] = suggestions.map((suggestion) => applySuggestion(fixer, suggestion));
            return fixes;
          },
        });
        filenameToIsAlreadyFixed.set(filename, true);
      },
    };
  },
};

module.exports = rule; // for ESLint's Node.js API
// eslint-disable-next-line import/no-default-export
export default rule; // for test
