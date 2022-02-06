import { resolve } from 'path';
import { Linter, ESLint } from 'eslint';
import { eslintInteractivePlugin, TransformArg, TransformName, TransformRuleOption } from '../../src/plugin/index.js';
import preferAdditionShorthand from './rules/prefer-addition-shorthand.js';

const DEFAULT_FILENAME = 'test.js';

/**
 * The type representing the test case.
 */
type TestCase<T extends TransformName> = {
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
  args?: TransformArg<T>;
};

type TestResult = string | null;

/**
 * The test utility for the transform.
 */
export class TransformTester<T extends TransformName> {
  private transformName: T;
  private defaultTransformArgs: TransformArg<T>;
  private defaultLinterConfig: Linter.Config;
  constructor(transformName: T, defaultTransformArgs: TransformArg<T>, defaultLinterConfig: Linter.Config) {
    this.transformName = transformName;
    this.defaultTransformArgs = defaultTransformArgs;
    this.defaultLinterConfig = defaultLinterConfig;
  }
  /**
   * Test the transform.
   * @param testCase The test case.
   * @returns The transformed code. If the transform skipped, null is returned.
   */
  async test(testCase: TestCase<T>): Promise<TestResult> {
    const code = Array.isArray(testCase.code) ? testCase.code.join('\n') : testCase.code;

    const filePath = testCase.filename ?? DEFAULT_FILENAME;

    const eslint1 = new ESLint({
      useEslintrc: false,
      plugins: {
        'eslint-interactive': {
          rules: {
            'prefer-addition-shorthand': preferAdditionShorthand,
          },
        },
      },
      overrideConfig: {
        plugins: ['eslint-interactive', ...(this.defaultLinterConfig.plugins ?? [])],
        rules: {
          'eslint-interactive/prefer-addition-shorthand': 2,
          ...Object.fromEntries(testCase.ruleIdsToTransform.map((ruleId) => [ruleId, 'error'])),
          ...this.defaultLinterConfig.rules,
        },
        ...this.defaultLinterConfig,
      },
    });
    const results1 = await eslint1.lintText(code, { filePath });

    const eslint = new ESLint({
      useEslintrc: false,
      plugins: {
        'eslint-interactive': eslintInteractivePlugin,
      },
      overrideConfig: {
        plugins: ['eslint-interactive', ...(this.defaultLinterConfig.plugins ?? [])],
        rules: {
          'eslint-interactive/transform': [
            2,
            {
              results: results1,
              ruleIds: testCase.ruleIdsToTransform,
              transform: { name: this.transformName, args: { ...this.defaultTransformArgs, ...testCase.args } },
            } as TransformRuleOption,
          ],
          ...this.defaultLinterConfig.rules,
        },
        ...this.defaultLinterConfig,
      },
      // NOTE: Only fix the `transform` rule problems.
      fix: (message) => message.ruleId === 'eslint-interactive/transform',
    });

    const results = await eslint.lintText(code, { filePath });

    const resultOfTargetFile = results.find((result) => result.filePath === resolve(filePath));
    if (!resultOfTargetFile) return null;
    return resultOfTargetFile.output ?? null;
  }
}
