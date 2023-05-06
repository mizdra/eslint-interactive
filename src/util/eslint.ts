import { AST, ESLint, Linter } from 'eslint';
import type { Comment } from 'estree';
import { DescriptionPosition } from 'src/cli/prompt.js';
import { unique } from './array.js';
import { notEmpty } from './type-check.js';

const COMMENT_RE =
  /^\s*(?<header>eslint-disable|eslint-disable-next-line)\s+(?<ruleList>[@a-z0-9\-_$/]*(?:\s*,\s*[@a-z0-9\-_$/]*)*(?:\s*,)?)(?:\s+--\s+(?<description>.*\S))?\s*$/u;

const SHEBANG_PATTERN = /^#!.+?\r?\n/u;

/** `results` 内で使われているプラグインの名前のリストを洗い出して返す */
export function scanUsedPluginsFromResults(results: ESLint.LintResult[]): string[] {
  const plugins = results
    .flatMap((result) => result.messages) // messages: Linter.LintMessage[]
    .map((message) => message.ruleId) // ruleIds: (string | undefined)[]
    .filter(notEmpty) // ruleIds: string[]
    .map((ruleId) => {
      const parts = ruleId.split('/');
      if (parts.length === 1) return undefined; // ex: 'rule-a'
      if (parts.length === 2) return parts[0]; // ex: 'plugin/rule-a'
      if (parts.length === 3) return `${parts[0]}/${parts[1]}`; // ex: '@scoped/plugin/rule-a'
      return undefined; // invalid ruleId
    }) // plugins: string[]
    .filter(notEmpty);
  return unique(plugins);
}

export type DisableComment = {
  type: 'Block' | 'Line';
  scope: 'next-line' | 'file';
  ruleIds: string[];
  description?: string;
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
    ruleIds: ruleIds,
    // description is optional
    ...(description === '' || description === undefined ? {} : { description }),
    range: comment.range,
    loc: comment.loc,
  };
}

/**
 * Convert `DisableComment` to comment text.
 */
export function toCommentText({
  type,
  scope,
  ruleIds,
  description,
  descriptionPosition,
}: Omit<DisableComment, 'range'>): string[] {
  const header = scope === 'next-line' ? 'eslint-disable-next-line' : 'eslint-disable';
  const ruleList = unique(ruleIds).join(', ');
  if (type === 'Line') {
    if (description === undefined) {
      return [`// ${header} ${ruleList}`];
    } else {
      if (descriptionPosition === 'previousLine') {
        return [`// ${description}`, `// ${header} ${ruleList}`];
      }
      return [`// ${header} ${ruleList} -- ${description}`];
    }
  } else {
    if (description === undefined) {
      return [`/* ${header} ${ruleList} */`];
    } else {
      if (descriptionPosition === 'previousLine') {
        return [`/* ${description} */`, `/* ${header} ${ruleList} */`];
      }
      return [`/* ${header} ${ruleList} -- ${description} */`];
    }
  }
}

export type InlineConfigComment = {
  description?: string;
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
