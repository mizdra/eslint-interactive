import { ESLint, Rule } from 'eslint';
import { importSync } from '../util/module.cjs';

// - eslint rule must be a cjs module
//   - For this reason, `src/rule/transform` module extension is cjs
// - Dynamic import is the only way to import esm from cjs
//   - ref: https://redfin.engineering/node-modules-at-war-why-commonjs-and-es-modules-cant-get-along-9617135eeca1
//   - Therefore, dynamic import of `transforms/*.ts` is required.
// - However, the eslint rule has to be synchronous
//   - Therefore, `await` cannot be used.
// - So we use `deasync` to do dynamic import synchronously.
const { createTransformToApplySuggestions } = importSync(() => import('../transforms/apply-suggestions.js'));
const { createTransformToDisablePerFile } = importSync(() => import('../transforms/disable-per-file.js'));
const { createTransformToDisablePerLine } = importSync(() => import('../transforms/disable-per-line.js'));
const { Transform, TransformContext } = importSync(() => import('../types.js'));

/**
 * @file The rule to do the transform.
 * The transform function returns the `Rule.Fix` that describes how to fix the code.
 * To apply the fix to your code, you need to use ESLint's API to apply the `Rule.Fix`.
 *
 * However, there is no dedicated API in ESLint to apply `Rule.Fix` (there is an internal API
 * called `SourceCodeFixer`,but it is not exposed to the public). For now, the only way
 * to apply `Rule.Fix` is to report a fixable problem from a rule and fix it
 * with `ESLint.outputFixes`.
 *
 * This module is a rule that executes a transform function and converts the return value
 * to a fixable problem.
 */

const filenameToIsAlreadyFixed = new Map<string, boolean>();

export type TransformRuleOption = {
  ruleIds: string[];
  results: ESLint.LintResult[];
  transform: Transform;
};

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

    const { transform, results, ruleIds } = context.options[0] as TransformRuleOption;

    const result = results.find((result) => result.filePath === filename);
    if (!result) return {};
    const messages = result.messages.filter((message) => message.ruleId && ruleIds.includes(message.ruleId));

    const transformContext: TransformContext = {
      filename: context.getFilename(),
      sourceCode: context.getSourceCode(),
      messages,
      ruleIds,
    };

    let fixes: Rule.Fix[] = [];
    if (transform.name === 'disablePerLine') {
      fixes = createTransformToDisablePerLine(transformContext, transform.args);
    } else if (transform.name === 'disablePerFile') {
      fixes = createTransformToDisablePerFile(transformContext, transform.args);
    } else if (transform.name === 'applySuggestions') {
      fixes = createTransformToApplySuggestions(transformContext, transform.args);
    } else {
      // eslint-disable-next-line @typescript-eslint/restrict-template-expressions, @typescript-eslint/no-explicit-any
      throw new Error(`Unknown transform: ${(transform as any).name}`);
    }

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
          message: `transform`,
          fix: () => sortedFixed,
        });
        filenameToIsAlreadyFixed.set(filename, true);
      },
    };
  },
};

// eslint-disable-next-line import/no-default-export
export default rule; // for test
