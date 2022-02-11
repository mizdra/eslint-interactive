import { resolve } from 'path';
import { Linter, ESLint } from 'eslint';
import { eslintInteractivePlugin, TransformArg, TransformName, TransformRuleOption } from '../plugin/index.js';

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

    const eslintForLint = this.createESLint({
      rules: {
        ...Object.fromEntries(testCase.ruleIdsToTransform.map((ruleId) => [ruleId, 'error'])),
      },
    });
    const resultsForLint = await eslintForLint.lintText(code, { filePath });

    const eslintForFix = this.createESLint({
      rules: {
        'eslint-interactive/transform': [
          2,
          {
            results: resultsForLint,
            ruleIds: testCase.ruleIdsToTransform,
            transform: { name: this.transformName, args: { ...this.defaultTransformArgs, ...testCase.args } },
          } as TransformRuleOption,
        ],
      },
      // NOTE: fix with `transform` rule.
      fix: true,
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
