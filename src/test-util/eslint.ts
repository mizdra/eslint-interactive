import { Rule, Linter, ESLint } from 'eslint';

export function fakeFix(arg?: Partial<Rule.Fix>): Rule.Fix {
  return {
    range: [0, 0],
    text: '',
    ...arg,
  };
}

export function fakeLintMessage(arg?: Partial<Linter.LintMessage>): Linter.LintMessage {
  return {
    column: 0,
    line: 0,
    ruleId: 'ruleId',
    message: 'message',
    severity: 2,
    ...arg,
  };
}

export function fakeLintResult(arg?: Partial<ESLint.LintResult>): ESLint.LintResult {
  return {
    filePath: '',
    messages: [],
    errorCount: 0,
    fatalErrorCount: 0,
    warningCount: 0,
    fixableErrorCount: 0,
    fixableWarningCount: 0,
    usedDeprecatedRules: [],
    suppressedMessages: [],
    ...arg,
  };
}

export function fakeSuggestion(arg?: Partial<Linter.LintSuggestion>): Linter.LintSuggestion {
  return {
    desc: 'description',
    fix: fakeFix(),
    ...arg,
  };
}

export function fakeSuggestions(): Linter.LintSuggestion[] {
  return [fakeSuggestion(), fakeSuggestion()];
}
