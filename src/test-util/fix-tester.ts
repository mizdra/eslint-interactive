import { Linter, Rule } from 'eslint';
import { FixContext } from '../plugin/index.js';
import { verifyAndFix } from '../plugin/linter.js';

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
   * The rule ids to fix.
   */
  ruleIdsToFix: string[];
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
  private linter: Linter;
  private fixCreator: (context: FixContext, args: FixArgs) => Rule.Fix[];
  private defaultFixArgs: FixArgs;
  private defaultLinterConfig: Linter.Config;
  constructor(
    fixCreator: (context: FixContext, args: FixArgs) => Rule.Fix[],
    defaultFixArgs: FixArgs,
    defaultLinterConfig: Linter.Config,
  ) {
    this.linter = new Linter();
    this.fixCreator = fixCreator;
    this.defaultFixArgs = defaultFixArgs;
    this.defaultLinterConfig = defaultLinterConfig;
  }
  /**
   * Test the fix.
   * @param testCase The test case.
   * @returns The fixed code. If the fix skipped, null is returned.
   */
  // eslint-disable-next-line @typescript-eslint/require-await -- TODO: remove `async`
  async test(testCase: TestCase<FixArgs>): Promise<TestResult> {
    const code = Array.isArray(testCase.code) ? testCase.code.join('\n') : testCase.code;

    const filePath = testCase.filename ?? DEFAULT_FILENAME;

    const config: Linter.Config = {
      ...this.defaultLinterConfig,
      rules: {
        ...this.defaultLinterConfig.rules,
        ...Object.fromEntries(testCase.ruleIdsToFix.map((ruleId) => [ruleId, 'error'])),
      },
    };
    const fixedResult = verifyAndFix(this.linter, code, config, filePath, testCase.ruleIdsToFix, (context) =>
      this.fixCreator(context, testCase.args ?? this.defaultFixArgs),
    );

    if (fixedResult.fixed) {
      return fixedResult.output;
    } else {
      return null;
    }
  }
}
