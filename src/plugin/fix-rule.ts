import { ESLint, Rule } from 'eslint';
import {
  createFixToApplyAutoFixes,
  createFixToApplySuggestions,
  createFixToConvertErrorToWarningPerFile,
  createFixToDisablePerFile,
  createFixToDisablePerLine,
  createFixToMakeFixableAndFix,
} from './fix/index.js';
import { ruleFixer } from './rule-fixer.js';
import { Fix, FixContext } from './index.js';

export const OVERLAPPED_PROBLEM_MESSAGE = 'overlapped';

// from: https://github.com/eslint/eslint/blob/58840ac844a61c72eabb603ecfb761812b82a7ed/lib/linter/report-translator.js#L136
function compareFixesByRange(a: Rule.Fix, b: Rule.Fix): number {
  return a.range[0] - b.range[0] || a.range[1] - b.range[1];
}

/**
 * @file The rule to do the fix.
 * The fix function returns the `Rule.Fix` that describes how to fix the code.
 * To apply the fix to your code, you need to use ESLint's API to apply the `Rule.Fix`.
 *
 * However, there is no dedicated API in ESLint to apply `Rule.Fix` (there is an internal API
 * called `SourceCodeFixer`,but it is not exposed to the public). For now, the only way
 * to apply `Rule.Fix` is to report a fixable problem from a rule and fix it
 * with `ESLint.outputFixes`.
 *
 * This module is a rule that executes a fix function and converts the return value
 * to a fixable problem.
 */

const fileStatusMap = new Map<string, { isAlreadyFixed: boolean; hasOverlappedProblem: boolean }>();

function createFixes(context: Rule.RuleContext, ruleOption: FixRuleOption, fixer: Rule.RuleFixer): Rule.Fix[] | null {
  const { fix, results, ruleIds } = ruleOption;
  const result = results.find((result) => result.filePath === context.getFilename());
  if (!result) return null;
  const messages = result.messages.filter((message) => message.ruleId && ruleIds.includes(message.ruleId));

  const fixContext: FixContext = {
    filename: context.getFilename(),
    sourceCode: context.getSourceCode(),
    messages,
    ruleIds,
    fixer,
  };

  let fixes: Rule.Fix[] = [];
  if (fix.name === 'applyAutoFixes') {
    fixes = createFixToApplyAutoFixes(fixContext, fix.args);
  } else if (fix.name === 'disablePerLine') {
    fixes = createFixToDisablePerLine(fixContext, fix.args);
  } else if (fix.name === 'disablePerFile') {
    fixes = createFixToDisablePerFile(fixContext, fix.args);
  } else if (fix.name === 'convertErrorToWarningPerFile') {
    fixes = createFixToConvertErrorToWarningPerFile(fixContext, fix.args);
  } else if (fix.name === 'applySuggestions') {
    fixes = createFixToApplySuggestions(fixContext, fix.args);
  } else if (fix.name === 'makeFixableAndFix') {
    fixes = createFixToMakeFixableAndFix(fixContext, fix.args);
  } else {
    // eslint-disable-next-line @typescript-eslint/restrict-template-expressions, @typescript-eslint/no-explicit-any
    throw new Error(`Unknown fix: ${(fix as any).name}`);
  }

  if (fixes.length === 0) return null;
  return fixes;
}

export type FixRuleOption = {
  ruleIds: string[];
  results: ESLint.LintResult[];
  fix: Fix;
};

export const fixRule: Rule.RuleModule = {
  meta: {
    fixable: 'code',
  },
  create(context: Rule.RuleContext) {
    // TODO: refactor
    return {
      // eslint-disable-next-line @typescript-eslint/naming-convention
      Program: () => {
        const filename = context.getFilename();

        // 🤯🤯🤯 THIS IS SUPER HACK!!! 🤯🤯🤯
        // fix するとコードが変わり、また別の lint エラーが発生する可能性があるため、eslint は `context.report` で
        // 報告されたエラーの fix がすべて終わったら、再び create を呼び出し、また `context.report` で fix 可能なエラーが
        // 報告されないかを確認する仕様になっている (これは `context.report` で fix 可能なものがなくなるまで続く)。
        // そのため、ここでは2回目以降 create が呼び出された時に、誤って再び fix してしまわないよう、fix 済み
        // であれば early return するようにしている。
        const status = fileStatusMap.get(filename) ?? { isAlreadyFixed: false, hasOverlappedProblem: false };
        if (status.isAlreadyFixed) {
          fileStatusMap.delete(filename); // Reset just in case.
          if (status.hasOverlappedProblem) {
            context.report({
              loc: {
                // The location is required, so set dummy values.
                line: 0,
                column: 0,
              },
              message: OVERLAPPED_PROBLEM_MESSAGE,
            });
          }
          return;
        }

        const ruleOption = context.options[0] as FixRuleOption;
        const newStatus = {
          isAlreadyFixed: true,
          hasOverlappedProblem: false,
        };

        const fixes = createFixes(context, ruleOption, ruleFixer);
        if (!fixes) return;
        fixes.sort(compareFixesByRange);

        let lastPos = 0;
        const fixesToReport: Rule.Fix[] = [];
        for (const fix of fixes) {
          if (fix.range[0] < lastPos) {
            newStatus.hasOverlappedProblem = true;
            continue;
          }
          fixesToReport.push(fix);
          lastPos = fix.range[1];
        }
        fileStatusMap.set(filename, newStatus);

        context.report({
          loc: {
            // The location is required, so set dummy values.
            line: 0,
            column: 0,
          },
          message: `fix`,
          fix: () => fixesToReport,
        });
      },
    };
  },
};
