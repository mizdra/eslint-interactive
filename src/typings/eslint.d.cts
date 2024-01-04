export {};

declare module 'eslint' {
  async function shouldUseFlatConfig(): Promise<boolean>;
  export { shouldUseFlatConfig };
}

declare module 'eslint/use-at-your-own-risk' {
  import { ESLint, Linter, shouldUseFlatConfig } from 'eslint';

  // https://eslint.org/blog/2022/08/new-config-system-part-3/#using-flat-config-with-the-eslint-class
  // https://github.com/eslint/eslint/blob/0a9c43339a4adef24ef83034d0b078dd279cc977/lib/eslint/flat-eslint.js#L66-L88
  // https://github.com/eslint/eslint/blob/0a9c43339a4adef24ef83034d0b078dd279cc977/lib/eslint/eslint-helpers.js#L656-L812
  // https://github.com/eslint/eslint/blob/5de9637fc925729a83d5a5e9e868a41792a184e3/lib/config/flat-config-schema.js#L1

  export interface FlatESLintOptions {
    // File enumeration
    cwd?: string | undefined;
    errorOnUnmatchedPattern?: boolean | undefined;
    // extensions?: string[] | undefined; // removed
    globInputPaths?: boolean | undefined;
    ignore?: boolean | undefined;
    // ignorePath?: string | undefined; // removed

    // Linting
    allowInlineConfig?: boolean | undefined;
    baseConfig?: Linter.FlatConfig | Linter.FlatConfig[] | undefined; // changed, https://github.com/eslint/eslint/blob/528e1c00dc2aa8636e5b706c4270dc655cfa17e3/tests/lib/eslint/flat-eslint.js#L5745
    overrideConfig?: Linter.FlatConfig | Linter.FlatConfig[] | undefined; // changed
    overrideConfigFile?: boolean | string | undefined; // changed, https://github.com/eslint/eslint/blob/0a9c43339a4adef24ef83034d0b078dd279cc977/lib/eslint/flat-eslint.js#L82
    // plugins?: Record<string, Plugin> | undefined; // removed
    reportUnusedDisableDirectives?: Linter.StringSeverity | undefined;
    // resolvePluginsRelativeTo?: string | undefined; // removed
    // rulePaths?: string[] | undefined; // removed
    // useEslintrc?: boolean | undefined; // removed, https://eslint.org/blog/2022/08/new-config-system-part-3/#using-flat-config-with-the-eslint-class

    // Autofix
    fix?: boolean | ((message: Linter.LintMessage) => boolean) | undefined;
    fixTypes?: Rule.RuleMetaData['type'][] | undefined;

    // Cache-related
    cache?: boolean | undefined;
    cacheLocation?: string | undefined;
    cacheStrategy?: 'content' | 'metadata' | undefined;
  }

  export class FlatESLint {
    constructor(options?: FlatESLintOptions);

    /**
     * The version text.
     * @type {string}
     */
    static get version(): string;

    /**
     * Outputs fixes from the given results to files.
     * @param {LintResult[]} results The lint results.
     * @returns {Promise<void>} Returns a promise that is used to track side effects.
     */
    static async outputFixes(results: Linter.LintResult[]): Promise<void>;

    /**
     * Returns results that only contains errors.
     * @param {LintResult[]} results The results to filter.
     * @returns {LintResult[]} The filtered results.
     */
    static getErrorResults(results: Linter.LintResult[]): Linter.LintResult[];

    /**
     * Returns meta objects for each rule represented in the lint results.
     * @param {LintResult[]} results The results to fetch rules meta for.
     * @returns {Object} A mapping of ruleIds to rule meta objects.
     * @throws {TypeError} When the results object wasn't created from this ESLint instance.
     * @throws {TypeError} When a plugin or rule is missing.
     */
    getRulesMetaForResults(results: Linter.LintResult[]): Record<string, Rule.RuleMetaData>;

    /**
     * Executes the current configuration on an array of file and directory names.
     * @param {string|string[]} patterns An array of file and directory names.
     * @returns {Promise<LintResult[]>} The results of linting the file patterns given.
     */
    async lintFiles(patterns: string | string[]): Promise<Linter.LintResult[]>;

    /**
     * Executes the current configuration on text.
     * @param {string} code A string of JavaScript code to lint.
     * @param {Object} [options] The options.
     * @param {string} [options.filePath] The path to the file of the source code.
     * @param {boolean} [options.warnIgnored] When set to true, warn if given filePath is an ignored path.
     * @returns {Promise<LintResult[]>} The results of linting the string of code given.
     */
    async lintText(
      code: string,
      options?: { filePath?: string | undefined; warnIgnored?: boolean | undefined },
    ): Promise<Linter.LintResult[]>;

    /**
     * Returns the formatter representing the given formatter name.
     * @param {string} [name] The name of the formatter to load.
     * The following values are allowed:
     * - `undefined` ... Load `stylish` builtin formatter.
     * - A builtin formatter name ... Load the builtin formatter.
     * - A third-party formatter name:
     *   - `foo` → `eslint-formatter-foo`
     *   - `@foo` → `@foo/eslint-formatter`
     *   - `@foo/bar` → `@foo/eslint-formatter-bar`
     * - A file path ... Load the file.
     * @returns {Promise<Formatter>} A promise resolving to the formatter object.
     * This promise will be rejected if the given formatter was not found or not
     * a function.
     */
    async loadFormatter(name?: string): Promise<ESLint.Formatter>;

    /**
     * Returns a configuration object for the given file based on the CLI options.
     * This is the same logic used by the ESLint CLI executable to determine
     * configuration for each file it processes.
     * @param {string} filePath The path of the file to retrieve a config object for.
     * @returns {Promise<ConfigData|undefined>} A configuration object for the file
     *      or `undefined` if there is no configuration data for the object.
     */
    async calculateConfigForFile(filePath: string): Promise<Linter.FlatConfig | undefined>;

    /**
     * Finds the config file being used by this instance based on the options
     * passed to the constructor.
     * @returns {string|undefined} The path to the config file being used or
     *      `undefined` if no config file is being used.
     */
    async findConfigFile(): Promise<string | undefined>;

    /**
     * Checks if a given path is ignored by ESLint.
     * @param {string} filePath The path of the file to check.
     * @returns {Promise<boolean>} Whether or not the given path is ignored.
     */
    async isPathIgnored(filePath: string): Promise<boolean>;
  }

  export { shouldUseFlatConfig, ESLint as LegacyESLint };
}
