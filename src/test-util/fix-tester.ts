import type { Linter, Rule } from 'eslint';
import { verifyAndFix } from '../eslint/linter.js';
import { LegacyESLint } from '../eslint/use-at-your-own-risk.js';
import type { FixContext } from '../fix/index.js';
import { plugin } from '../plugin.js';

const DEFAULT_FILENAME = 'test.js';

/**
 * The type representing the test case.
 */
type TestCase<FixArgs> = {
  /**
   * The filename of the code.
   */
  filename?: string;
  /**
   * The code to be fixed.
   */
  code: string | string[];
  /**
   * The rules to fix.
   */
  rules: Partial<Linter.RulesRecord>;
  /**
   * The arguments to pass to the fix function.
   */
  args?: FixArgs;
};

type TestResult = string | null;

/**
 * The test utility for the fix.
 */
export class FixTester<FixArgs> {
  private fixCreator: (context: FixContext, args: FixArgs) => Rule.Fix[];
  private defaultFixArgs: FixArgs;
  private defaultLinterConfig: Linter.LegacyConfig;
  constructor(
    fixCreator: (context: FixContext, args: FixArgs) => Rule.Fix[],
    defaultFixArgs: FixArgs,
    defaultLinterConfig: Linter.LegacyConfig,
  ) {
    this.fixCreator = fixCreator;
    this.defaultFixArgs = defaultFixArgs;
    this.defaultLinterConfig = defaultLinterConfig;
  }
  /**
   * Test the fix.
   * @param testCase The test case.
   * @returns The fixed code. If the fix skipped, null is returned.
   */
  async test(testCase: TestCase<FixArgs>): Promise<TestResult> {
    const code = Array.isArray(testCase.code) ? testCase.code.join('\n') : testCase.code;

    const filePath = testCase.filename ?? DEFAULT_FILENAME;

    const ruleIdsToFix = Object.keys(testCase.rules);
    const eslint = new LegacyESLint({
      useEslintrc: false,
      plugins: {
        'eslint-interactive': plugin,
      },
      overrideConfig: {
        ...this.defaultLinterConfig,
        plugins: ['eslint-interactive', ...(this.defaultLinterConfig.plugins ?? [])],
        rules: {
          ...this.defaultLinterConfig.rules,
          ...testCase.rules,
          'eslint-interactive/source-code-snatcher': 'error',
        },
      },
    });
    const fixedResult = await verifyAndFix(eslint, code, filePath, ruleIdsToFix, (context) =>
      this.fixCreator(context, testCase.args ?? this.defaultFixArgs),
    );

    if (fixedResult.fixed) {
      return fixedResult.output;
    } else {
      return null;
    }
  }
}
