import { ESLint } from 'eslint';
import type { Comment } from 'estree';
import { unique } from './array';
import { notEmpty } from './type-check';

const COMMENT_RE =
  /^\s*(?<header>eslint-disable|eslint-disable-next-line)\s+(?<ruleList>[@a-z0-9\-_$/]*(?:\s*,\s*[@a-z0-9\-_$/]*)*(?:\s*,)?)(?:\s+--\s+(?<description>.*\S))?\s*$/u;

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
};

/**
 * コメントを ESLint の disable comment としてパースする。
 * disable comment としてパースできなかった場合は undefined を返す。
 *
 * ## 参考: disable comment の構造
 * /* eslint-disable-next-line rule-a, rule-b, rule-c, rule-d -- I'm the rules.
 *    ^^^^^^^^^^^^^^^^^^^^^^^^ ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^ ^^ ^^^^^^^^^^^^^^
 *    |                        |                              |  |
 *    header                   |                              |  |
 *                             ruleList                       |  |
 *                                            descriptionHeader  |
 *                                                               description
 */
export function parseDisableComment(comment: Comment): DisableComment | undefined {
  // NOTE: コメントノードには必ず range があるはずだが、型上は optional なので、
  // range がない場合はパースに失敗した扱いにする。
  if (!comment.range) return undefined;

  const result = COMMENT_RE.exec(comment.value);
  if (!result) return undefined;
  if (!result.groups) return undefined;

  const { header, ruleList, description } = result.groups;
  const ruleIds = ruleList
    .split(',')
    .map((r) => r.trim())
    // 空文字は除外しておく
    .filter((ruleId) => ruleId !== '');

  const scope = header === 'eslint-disable-next-line' ? 'next-line' : 'file';
  // file scope comment must be block-style.
  if (scope === 'file' && comment.type === 'Line') return undefined;

  return {
    type: comment.type,
    scope: header === 'eslint-disable-next-line' ? 'next-line' : 'file',
    ruleIds: ruleIds,
    // description is optional
    ...(description === '' || description === undefined ? {} : { description }),
    range: comment.range,
  };
}

/**
 * Convert `DisableComment` to comment text.
 */
export function toCommentText({ type, scope, ruleIds, description }: Omit<DisableComment, 'range'>): string {
  const header = scope === 'next-line' ? 'eslint-disable-next-line' : 'eslint-disable';
  const ruleList = unique(ruleIds).join(', ');
  if (type === 'Line') {
    if (description === undefined) {
      return `// ${header} ${ruleList}`;
    } else {
      return `// ${header} ${ruleList} -- ${description}`;
    }
  } else {
    if (description === undefined) {
      return `/* ${header} ${ruleList} */`;
    } else {
      return `/* ${header} ${ruleList} -- ${description} */`;
    }
  }
}

/**
 * Create the results with only messages with the specified rule ids.
 * @param results The lint results.
 * @param ruleIds The rule ids.
 * @returns The results with only messages with the specified rule ids
 */
export function filterResultsByRuleId(results: ESLint.LintResult[], ruleIds: string[]): ESLint.LintResult[] {
  return results.map((result) => {
    return {
      ...result,
      messages: result.messages.filter((message) => message.ruleId !== null && ruleIds.includes(message.ruleId)),
    };
  });
}

/**
 * push rule ids to the disable comment and return the new comment node.
 * @param comment The comment node to be modified
 * @param ruleIds The rule ids to be added
 * @returns The new comment node
 */
export function pushRuleIdsToDisableComment(comment: DisableComment, ruleIds: string[]): DisableComment {
  return {
    ...comment,
    ruleIds: unique([...comment.ruleIds, ...ruleIds]),
  };
}

export function mergeRuleIdsAndDescription(
  a: { ruleIds: string[]; description?: string },
  b: { ruleIds: string[]; description?: string },
): { ruleIds: string[]; description?: string } {
  const ruleIds = [...a.ruleIds, ...b.ruleIds];
  const description =
    a.description !== undefined && b.description !== undefined
      ? `${a.description}, ${b.description}`
      : a.description !== undefined && b.description === undefined
      ? a.description
      : a.description === undefined && b.description !== undefined
      ? b.description
      : undefined;
  return { ruleIds, description };
}
