import { Linter } from 'eslint';
import rule from '../../src/rules/apply-fixes';
import { TransformContext, TransformFunction } from '../../src/types';

const DEFAULT_FILENAME = 'test.js';

const linter = new Linter();
linter.defineRule('apply-fixes', rule);

type TestCase<T> = {
  filename?: string;
  code: string | string[];
  ruleIdsToLint: string[];
  ruleIdsToTransform: string[];
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
      rules: Object.fromEntries(testCase.ruleIdsToLint.map((ruleId) => [ruleId, 'error'])),
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
