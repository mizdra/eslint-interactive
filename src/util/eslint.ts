import { join, relative } from 'node:path';
import { AST, ESLint, Linter, Rule, SourceCode } from 'eslint';
import { FlatESLint, FlatESLintOptions } from 'eslint/use-at-your-own-risk';
import type { Comment, SourceLocation } from 'estree';
import { Config } from '../core.js';
import { eslintInteractivePlugin, Fix, FixRuleOption } from '../plugin/index.js';
import { unique } from './array.js';
import { getCacheDir } from './cache.js';

const COMMENT_RE =
  /^\s*(?<header>eslint-disable|eslint-disable-next-line)\s+(?<ruleList>[@a-z0-9\-_$/]*(?:\s*,\s*[@a-z0-9\-_$/]*)*(?:\s*,)?)(?:\s+--\s+(?<description>.*\S))?\s*$/u;

const SHEBANG_PATTERN = /^#!.+?\r?\n/u;

export type DisableComment = {
  type: 'Block' | 'Line';
  scope: 'next-line' | 'file';
  ruleIds: string[];
  description?: string | undefined;
  range: [number, number];
  loc: SourceLocation;
};

/**
 * Parses the comment as an ESLint disable comment.
 * Returns undefined if the comment cannot be parsed as a disable comment.
 *
 * ## Reference: Structure of a disable comment
 * /* eslint-disable-next-line rule-a, rule-b, rule-c, rule-d -- I'm the rules.
 *    ^^^^^^^^^^^^^^^^^^^^^^^^ ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^ ^^ ^^^^^^^^^^^^^^
 *    |                        |                              |  |
 *    header                   |                              |  |
 *                             ruleList                       |  |
 *                                            descriptionHeader  |
 *                                                               description
 */
export function parseDisableComment(comment: Comment): DisableComment | undefined {
  // NOTE: Comment nodes should always have range and loc, but they are optional in the types.
  // If range or loc is missing, consider the parsing failed.
  if (!comment.range || !comment.loc) return undefined;

  const result = COMMENT_RE.exec(comment.value);
  if (!result) return undefined;
  if (!result.groups) return undefined;

  const { header, ruleList, description } = result.groups;
  if (header === undefined || ruleList === undefined) return undefined;
  const ruleIds = ruleList
    .split(',')
    .map((r) => r.trim())
    // Exclude empty strings
    .filter((ruleId) => ruleId !== '');

  const scope = header === 'eslint-disable-next-line' ? 'next-line' : 'file';
  // A file scope comment must be block-style.
  if (scope === 'file' && comment.type === 'Line') return undefined;

  return {
    type: comment.type,
    scope: header === 'eslint-disable-next-line' ? 'next-line' : 'file',
    ruleIds,
    // description is optional
    ...(description === '' || description === undefined ? {} : { description }),
    range: comment.range,
    loc: comment.loc,
  };
}

/**
 * Convert text to comment text.
 */
export function toCommentText(args: { type: 'Line' | 'Block'; text: string }): string {
  const { type, text } = args;
  if (type === 'Line') {
    return `// ${text}`;
  } else {
    return `/* ${text} */`;
  }
}

/**
 * Convert `DisableComment` to comment text.
 */
export function toDisableCommentText({
  type,
  scope,
  ruleIds,
  description,
}: Omit<DisableComment, 'range' | 'loc'>): string {
  const header = scope === 'next-line' ? 'eslint-disable-next-line' : 'eslint-disable';
  const ruleList = unique(ruleIds).join(', ');
  const footer = description === undefined ? '' : ` -- ${description}`;
  return toCommentText({ type, text: `${header} ${ruleList}${footer}` });
}

function getIndentFromLine(sourceCode: SourceCode, line: number): string {
  const headNodeIndex = sourceCode.getIndexFromLoc({ line, column: 0 });
  // Extract the same indent as the line we want to fix
  const indent = sourceCode.text.slice(
    headNodeIndex,
    headNodeIndex +
      sourceCode.text
        .slice(headNodeIndex)
        // ref: https://tc39.es/ecma262/#sec-white-space
        // eslint-disable-next-line no-control-regex
        .search(/[^\u{0009}\u{000B}\u{000C}\u{FEFF}\p{gc=Space_Separator}]/u),
  );
  return indent;
}

function isLineInJSXText(sourceCode: SourceCode, line: number): boolean {
  const headNodeIndex = sourceCode.getIndexFromLoc({ line, column: 0 });
  const headNode = sourceCode.getNodeByRangeIndex(headNodeIndex);
  return headNode?.type === 'JSXText';
}

/**
 * Merge the ruleIds of the disable comments.
 * @param a The ruleIds of first disable comment
 * @param b The ruleIds of second disable comment
 * @returns The ruleIds of merged disable comment
 */
export function mergeRuleIds(a: string[], b: string[]): string[] {
  return unique([...a, ...b]);
}

/**
 * Merge the description of the disable comments.
 * @param a The description of first disable comment
 * @param b The description of second disable comment
 * @returns The description of merged disable comment
 */
export function mergeDescription(a: string | undefined, b: string | undefined): string | undefined {
  if (a === undefined && b === undefined) return undefined;
  if (a === undefined) return b;
  if (b === undefined) return a;
  return `${a}, ${b}`;
}

export function insertDescriptionCommentStatementBeforeLine(args: {
  fixer: Rule.RuleFixer;
  sourceCode: SourceCode;
  line: number;
  description: string;
}): Rule.Fix {
  const { fixer, sourceCode, line, description } = args;
  const indent = getIndentFromLine(sourceCode, line);
  const headNodeIndex = sourceCode.getIndexFromLoc({ line, column: 0 });

  if (isLineInJSXText(sourceCode, line)) {
    const commentText = toCommentText({ type: 'Block', text: description });
    return fixer.insertTextBeforeRange([headNodeIndex, headNodeIndex], `${indent}{${commentText}}\n`);
  } else {
    const commentText = toCommentText({ type: 'Line', text: description });
    return fixer.insertTextBeforeRange([headNodeIndex, headNodeIndex], `${indent}${commentText}\n`);
  }
}

/**
 * Update existing disable comment.
 * @returns The eslint's fix object
 */
export function updateDisableComment(args: {
  fixer: Rule.RuleFixer;
  disableComment: DisableComment;
  newRules: string[];
  newDescription: string | undefined;
}): Rule.Fix {
  const { fixer, disableComment: existingDisableComment, newRules, newDescription } = args;
  const newDisableCommentText = toDisableCommentText({
    type: existingDisableComment.type,
    scope: existingDisableComment.scope,
    ruleIds: newRules,
    description: newDescription,
  });
  return fixer.replaceTextRange(existingDisableComment.range, newDisableCommentText);
}

export function insertDisableCommentStatementBeforeLine(args: {
  fixer: Rule.RuleFixer;
  sourceCode: SourceCode;
  line: number;
  scope: 'file' | 'next-line';
  ruleIds: string[];
  description: string | undefined;
}) {
  const { fixer, sourceCode, line, scope, ruleIds, description } = args;
  const indent = getIndentFromLine(sourceCode, line);
  const headNodeIndex = sourceCode.getIndexFromLoc({ line, column: 0 });
  const isInJSXText = isLineInJSXText(sourceCode, line);
  const type = isInJSXText || scope === 'file' ? 'Block' : 'Line';
  const disableCommentText = toDisableCommentText({
    type,
    scope,
    ruleIds,
    description,
  });
  if (isInJSXText) {
    return fixer.insertTextBeforeRange([headNodeIndex, headNodeIndex], `${indent}{${disableCommentText}}\n`);
  } else {
    return fixer.insertTextBeforeRange([headNodeIndex, headNodeIndex], `${indent}${disableCommentText}\n`);
  }
}

export type InlineConfigComment = {
  description?: string | undefined;
  rulesRecord: Partial<Linter.RulesRecord>;
  range: [number, number];
};

/**
 * Convert `InlineConfigComment` to comment text.
 */
export function toInlineConfigCommentText({ rulesRecord, description }: Omit<InlineConfigComment, 'range'>): string {
  const header = 'eslint';
  const rulesRecordText = Object.entries(rulesRecord)
    .map(([ruleId, ruleEntry]) => {
      // TODO: Inherit options of the rule set by the user in eslintrc if the option exists.
      return `${ruleId}: ${JSON.stringify(ruleEntry)}`;
    })
    .join(', ');
  if (description === undefined) {
    return `/* ${header} ${rulesRecordText} */`;
  } else {
    return `/* ${header} ${rulesRecordText} -- ${description} */`;
  }
}

/**
 * Create the results with only messages with the specified rule ids.
 * @param results The lint results.
 * @param ruleIds The rule ids.
 * @returns The results with only messages with the specified rule ids
 */
export function filterResultsByRuleId(results: ESLint.LintResult[], ruleIds: (string | null)[]): ESLint.LintResult[] {
  return results
    .map((result) => {
      return {
        ...result,
        messages: result.messages.filter((message) => ruleIds.includes(message.ruleId)),
      };
    })
    .filter((result) => result.messages.length > 0);
}

/**
 * Find shebang from the first line of the file.
 * @param sourceCodeText The source code text of the file.
 * @returns The information of shebang. If the file does not have shebang, return null.
 */
export function findShebang(sourceCodeText: string): { range: AST.Range } | null {
  const result = SHEBANG_PATTERN.exec(sourceCodeText);
  if (!result) return null;
  return { range: [0, result[0].length] };
}

export type ESLintOptions = ({ type: 'legacy' } & ESLint.Options) | ({ type: 'flat' } & FlatESLintOptions);

export type NormalizedESLintOptions = Omit<ESLint.Options, 'cwd'> & {
  type: 'legacy';
  cwd: Exclude<ESLint.Options['cwd'], undefined>;
};

export type NormalizedFlatESLintOptions = Omit<FlatESLintOptions, 'cwd'> & {
  type: 'flat';
  cwd: Exclude<FlatESLintOptions['cwd'], undefined>;
};

export type NormalizedConfig = NormalizedESLintOptions | NormalizedFlatESLintOptions;

/** Default config of `Core` */
export const configDefaults = {
  formatterName: 'codeframe',
  quiet: false,
  eslintOptions: {
    type: 'legacy',
    useEslintrc: true,
    overrideConfigFile: undefined,
    extensions: undefined,
    rulePaths: undefined,
    ignorePath: undefined,
    cache: true,
    cacheLocation: relative(process.cwd(), join(getCacheDir(), '.eslintcache')),
    overrideConfig: undefined,
    cwd: process.cwd(),
    resolvePluginsRelativeTo: undefined,
  },
} satisfies Partial<Config>;

export function normalizeConfig(config: ESLintOptions): NormalizedConfig {
  if (config.type === 'legacy') {
    return {
      type: 'legacy',
      useEslintrc: config.useEslintrc ?? configDefaults.eslintOptions.useEslintrc,
      overrideConfigFile: config.overrideConfigFile ?? configDefaults.eslintOptions.overrideConfigFile,
      extensions: config.extensions ?? configDefaults.eslintOptions.extensions,
      rulePaths: config.rulePaths ?? configDefaults.eslintOptions.rulePaths,
      ignorePath: config.ignorePath ?? configDefaults.eslintOptions.ignorePath,
      cache: config.cache ?? configDefaults.eslintOptions.cache,
      cacheLocation: config.cacheLocation ?? configDefaults.eslintOptions.cacheLocation,
      overrideConfig: config.overrideConfig ?? configDefaults.eslintOptions.overrideConfig,
      cwd: config.cwd ?? configDefaults.eslintOptions.cwd,
      resolvePluginsRelativeTo:
        config.resolvePluginsRelativeTo ?? configDefaults.eslintOptions.resolvePluginsRelativeTo,
    };
  } else {
    return {
      type: 'flat',
      overrideConfigFile: config.overrideConfigFile ?? configDefaults.eslintOptions.overrideConfigFile,
      cache: config.cache ?? configDefaults.eslintOptions.cache,
      cacheLocation: config.cacheLocation ?? configDefaults.eslintOptions.cacheLocation,
      overrideConfig: config.overrideConfig ?? configDefaults.eslintOptions.overrideConfig,
      cwd: config.cwd ?? configDefaults.eslintOptions.cwd,
    };
  }
}

export function createESLint(config: NormalizedConfig): ESLint | InstanceType<typeof FlatESLint> {
  if (config.type === 'legacy') {
    const { type, ...rest } = config;
    return new ESLint(rest);
  } else {
    const { type, ...rest } = config;
    return new FlatESLint(rest);
  }
}

export function createESLintForFix(
  config: NormalizedConfig,
  results: ESLint.LintResult[],
  ruleIds: string[],
  fix: Fix,
  usedRuleIds: string[],
): ESLint | InstanceType<typeof FlatESLint> {
  if (config.type === 'legacy') {
    const { type, ...rest } = config;
    return new ESLint({
      ...rest,
      // This is super hack to load ESM plugin/rule.
      // ref: https://github.com/eslint/eslint/issues/15453#issuecomment-1001200953
      plugins: {
        'eslint-interactive': eslintInteractivePlugin,
      },
      overrideConfig: {
        plugins: ['eslint-interactive'],
        rules: {
          'eslint-interactive/fix': [2, { results, ruleIds, fix } as FixRuleOption],
          // Turn off all rules except `eslint-interactive/fix` when fixing for performance.
          ...Object.fromEntries(usedRuleIds.map((ruleId) => [ruleId, 'off'])),
        },
      },
      // NOTE: Only fix the `fix` rule problems.
      fix: (message) => message.ruleId === 'eslint-interactive/fix',
      // Don't interpret lintFiles arguments as glob patterns for performance.
      globInputPaths: false,
    });
  } else {
    const { type, ...rest } = config;
    return new FlatESLint({
      ...rest,
      overrideConfig: {
        plugins: {
          'eslint-interactive': eslintInteractivePlugin,
        },
        rules: {
          'eslint-interactive/fix': [2, { results, ruleIds, fix } as FixRuleOption],
          // Turn off all rules except `eslint-interactive/fix` when fixing for performance.
          ...Object.fromEntries(usedRuleIds.map((ruleId) => [ruleId, 'off'])),
        },
      },
      // NOTE: Only fix the `fix` rule problems.
      fix: (message) => message.ruleId === 'eslint-interactive/fix',
      // Don't interpret lintFiles arguments as glob patterns for performance.
      globInputPaths: false,
    });
  }
}
