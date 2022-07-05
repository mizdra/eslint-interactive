import { resolve } from 'path';
import { Linter, ESLint } from 'eslint';
import { eslintInteractivePlugin, FixArg, FixName, FixRuleOption } from '../plugin/index.js';

const DEFAULT_FILENAME = 'test.js';

/**
 * The type representing the test case.
 */
type TestCase<T extends FixName> = {
  /**
   * The filename of the code.
   */
  filename?: string;
  /**
   * The code to be fixed.
   */
  code: string | string[];
  /**
   * The rule ids to fix.
   */
  ruleIdsToFix: string[];
  /**
   * The arguments to pass to the fix function.
   */
  args?: FixArg<T>;
};

type TestResult = string | null;

/**
 * The test utility for the fix.
 */
export class FixTester<T extends FixName> {
  private fixName: T;
  private defaultFixArgs: FixArg<T>;
  private defaultLinterConfig: Linter.Config;
  constructor(fixName: T, defaultFixArgs: FixArg<T>, defaultLinterConfig: Linter.Config) {
    this.fixName = fixName;
    this.defaultFixArgs = defaultFixArgs;
    this.defaultLinterConfig = defaultLinterConfig;
  }
  /**
   * Test the fix.
   * @param testCase The test case.
   * @returns The fixed code. If the fix skipped, null is returned.
   */
  async test(testCase: TestCase<T>): Promise<TestResult> {
    const code = Array.isArray(testCase.code) ? testCase.code.join('\n') : testCase.code;

    const filePath = testCase.filename ?? DEFAULT_FILENAME;

    const eslintForLint = this.createESLint({
      rules: {
        ...Object.fromEntries(testCase.ruleIdsToFix.map((ruleId) => [ruleId, 'error'])),
      },
    });
    const resultsForLint = await eslintForLint.lintText(code, { filePath });

    const eslintForFix = this.createESLint({
      rules: {
        'eslint-interactive/fix': [
          2,
          {
            results: resultsForLint,
            ruleIds: testCase.ruleIdsToFix,
            fix: { name: this.fixName, args: { ...this.defaultFixArgs, ...testCase.args } },
          } as FixRuleOption,
        ],
      },
      // NOTE: Only fix the `fix` rule problems.
      fix: (message) => message.ruleId === 'eslint-interactive/fix',
    });
    const resultsForFix = await eslintForFix.lintText(code, { filePath });

    const resultOfTargetFile = resultsForFix.find((result) => result.filePath === resolve(filePath));
    if (!resultOfTargetFile) return null;
    return resultOfTargetFile.output ?? null;
  }

  private createESLint(options: { rules?: Linter.HasRules['rules']; fix?: ESLint.Options['fix'] }): ESLint {
    return new ESLint({
      useEslintrc: false,
      plugins: {
        'eslint-interactive': eslintInteractivePlugin,
      },
      overrideConfig: {
        plugins: ['eslint-interactive', ...(this.defaultLinterConfig.plugins ?? [])],
        rules: {
          ...this.defaultLinterConfig.rules,
          ...options.rules,
        },
        ...this.defaultLinterConfig,
      },
      fix: options.fix,
    });
  }
}
