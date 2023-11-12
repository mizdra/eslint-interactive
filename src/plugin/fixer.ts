import { ESLint, Linter, SourceCode, Rule } from 'eslint';
import {
  createFixToApplyAutoFixes,
  createFixToApplySuggestions,
  createFixToConvertErrorToWarningPerFile,
  createFixToDisablePerFile,
  createFixToDisablePerLine,
  createFixToMakeFixableAndFix,
} from './fix/index.js';
import { ruleFixer } from './rule-fixer.js';
import { SourceCodeFixer } from './source-code-fixer.js';
import { Fix, FixContext } from './index.js';

const linter = new Linter();

function createFixes(filename: string, sourceCode: SourceCode, fixerOptions: FixerOptions): Rule.Fix[] {
  const { fix, result, ruleIds } = fixerOptions;
  const messages = result.messages.filter((message) => message.ruleId && ruleIds.includes(message.ruleId));

  const fixContext: FixContext = {
    filename,
    sourceCode,
    messages,
    ruleIds,
    fixer: ruleFixer,
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

  return fixes;
}

export type FixerOptions = {
  ruleIds: string[];
  result: ESLint.LintResult;
  fix: Fix;
};

function getSourceCodeFromResult(result: ESLint.LintResult): SourceCode {
  if (!result.source) throw new Error('Source code is required to apply fixes.');
  linter.verify(result.source, {}, result.filePath);
  return linter.getSourceCode();
}

export function applyFixes(fixerOptions: FixerOptions): ReturnType<typeof SourceCodeFixer.applyFixes> {
  const sourceCode = getSourceCodeFromResult(fixerOptions.result);
  const fixes = createFixes(fixerOptions.result.filePath, sourceCode, fixerOptions);

  const messages: Linter.LintMessage[] = fixes.map((fix) => {
    return {
      ruleId: 'eslint-interactive/fix',
      severity: 2,
      message: 'fix',
      line: 0,
      column: 0,
      fix,
    };
  });

  return SourceCodeFixer.applyFixes(sourceCode.text, messages, true);
}
