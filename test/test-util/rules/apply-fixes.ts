import { Rule } from 'eslint';

/**
 * @file The rule to apply to `Rule.Fix`.
 */

const filenameToIsAlreadyFixed = new Map<string, boolean>();

export type ApplyFixesRuleOption = Rule.Fix[];

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

    const fixes = context.options[0] as ApplyFixesRuleOption;

    if (fixes.length === 0) return {};

    // 🤯🤯🤯 THIS IS SUPER HACK!!! 🤯🤯🤯
    // `disablePerFile` などでは、1つ message を修正する度に、disable comment が 1 行追加されて、message に格納されている位置情報と、
    // 本来修正するべきコードの位置が 1 行ずれてしまう。そこで、ファイルの後ろ側の行の message から修正していくことで、
    // message の位置情報と本来修正するべきコードの位置情報がずれないようにしている。
    const sortedFixed = fixes.sort((a, b) => b.range[0] - a.range[0]);

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
          message: `verify-and-fix`,
          fix: () => sortedFixed,
        });
        filenameToIsAlreadyFixed.set(filename, true);
      },
    };
  },
};

// eslint-disable-next-line import/no-default-export
export default rule;
