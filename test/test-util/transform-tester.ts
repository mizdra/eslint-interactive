import { Linter } from 'eslint';
import { TransformContext, TransformFunction } from '../../src/plugin/index.js';
import applyFixesRule from './rules/apply-fixes.js';
import preferAdditionShorthand from './rules/prefer-addition-shorthand.js';

const DEFAULT_FILENAME = 'test.js';

const linter = new Linter();
linter.defineRule('apply-fixes', applyFixesRule);
linter.defineRule('prefer-addition-shorthand', preferAdditionShorthand);

/**
 * The type representing the test case.
 */
type TestCase<T> = {
  /**
   * The filename of the code.
   */
  filename?: string;
  /**
   * The code to be transformed.
   */
  code: string | string[];
  /**
   * The rule ids to transform.
   */
  ruleIdsToTransform: string[];
  /**
   * The arguments to pass to the transform function.
   */
  args?: T;
};

type TestResult = string | null;

function createTransformContext<T>(
  testCase: TestCase<T>,
  code: string,
  defaultLinterConfig: Linter.Config,
): TransformContext {
  const filename = testCase.filename ?? DEFAULT_FILENAME;
  const messages = linter.verify(
    code,
    {
      rules: Object.fromEntries(testCase.ruleIdsToTransform.map((ruleId) => [ruleId, 'error'])),
      ...defaultLinterConfig,
    },
    { filename },
  );
  const sourceCode = linter.getSourceCode();
  const filteredMessages = messages.filter(
    (message) => message.ruleId && testCase.ruleIdsToTransform.includes(message.ruleId),
  );
  return {
    filename,
    sourceCode,
    messages: filteredMessages,
    ruleIds: testCase.ruleIdsToTransform,
  };
}

/**
 * The test utility for the transform.
 */
export class TransformTester<T> {
  private transformFunction: TransformFunction<T>;
  private defaultArgs: T;
  private defaultLinterConfig: Linter.Config;
  constructor(transformFunction: TransformFunction<T>, defaultArgs: T, defaultLinterConfig: Linter.Config) {
    this.transformFunction = transformFunction;
    this.defaultArgs = defaultArgs;
    this.defaultLinterConfig = defaultLinterConfig;
  }
  /**
   * Test the transform.
   * @param testCase The test case.
   * @returns The transformed code. If the transform skipped, null is returned.
   */
  test(testCase: TestCase<T>): TestResult {
    const code = Array.isArray(testCase.code) ? testCase.code.join('\n') : testCase.code;
    const context = createTransformContext(testCase, code, this.defaultLinterConfig);
    const fixes = this.transformFunction(context, testCase.args ?? this.defaultArgs);

    const report = linter.verifyAndFix(
      code,
      {
        rules: {
          'apply-fixes': [2, fixes],
        },
        ...this.defaultLinterConfig,
      },
      testCase.filename ?? DEFAULT_FILENAME,
    );
    if (report.fixed) return report.output;
    return null;
  }
}
