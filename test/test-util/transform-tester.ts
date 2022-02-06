import { resolve } from 'path';
import { Linter, ESLint } from 'eslint';
import { TransformContext, TransformFunction } from '../../src/plugin/index.js';
import applyFixesRule from './rules/apply-fixes.js';
import preferAdditionShorthand from './rules/prefer-addition-shorthand.js';

const DEFAULT_FILENAME = 'test.js';

const linter = new Linter();
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
  async test(testCase: TestCase<T>): Promise<TestResult> {
    const code = Array.isArray(testCase.code) ? testCase.code.join('\n') : testCase.code;
    const context = createTransformContext(testCase, code, this.defaultLinterConfig);
    const fixes = this.transformFunction(context, testCase.args ?? this.defaultArgs);

    const eslint = new ESLint({
      useEslintrc: false,
      plugins: {
        'eslint-interactive': {
          rules: {
            'apply-fixes': applyFixesRule,
          },
        },
      },
      overrideConfig: {
        plugins: ['eslint-interactive', ...(this.defaultLinterConfig.plugins ?? [])],
        rules: {
          'eslint-interactive/apply-fixes': [2, fixes],
          ...this.defaultLinterConfig.rules,
        },
        ...this.defaultLinterConfig,
      },
      // NOTE: Only fix the `apply-fixes` rule problems.
      fix: (message) => message.ruleId === 'eslint-interactive/apply-fixes',
    });

    const filePath = testCase.filename ?? DEFAULT_FILENAME;

    const results = await eslint.lintText(code, { filePath: testCase.filename ?? DEFAULT_FILENAME });

    const resultOfTargetFile = results.find((result) => result.filePath === resolve(filePath));
    if (!resultOfTargetFile) return null;
    return resultOfTargetFile.output ?? null;
  }
}
