// eslint-disable-next-line import/no-unresolved
import type { Comment } from 'estree';

export type ESLintDisableComment = {
  type: 'Block' | 'Line';
  ruleIds: string[];
  description?: string;
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
export function parseCommentAsESLintDisableComment(comment: Comment): ESLintDisableComment | null {
  // text: header + spaces + ruleList + spaces (+ descriptionHeader + spaces + description)
  let text = comment.value.trim();

  const result1 = /^eslint-disable-next-line\s+/.exec(text);
  if (result1 === null) return null;
  // text: ruleList + spaces (+ descriptionHeader + spaces + description)
  text = text.slice(result1[0].length);

  // description があるかの確認を行う
  const result2 = /\s--\s+(?<description>.*)/u.exec(text);
  // result2.groups.description: description

  let description: string | undefined = undefined;
  if (result2 !== null) {
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    description = result2.groups!.description;
    // text: ruleList + spaces
    text = text.slice(0, result2.index);
  }
  // text: ruleList
  text = text.trimRight();

  const ruleIds = text
    .split(',')
    .map((r) => r.trim())
    // 空文字は除外しておく
    .filter((ruleId) => ruleId !== '');

  if (description) {
    return {
      type: comment.type,
      ruleIds,
      description,
    };
  } else {
    return {
      type: comment.type,
      ruleIds,
    };
  }
}

/**
 * `ESLintDisableComment` 型からコメントのテキスト表現を作成する
 */
export function createCommentNodeText({ type, ruleIds, description }: ESLintDisableComment): string {
  const ruleList = ruleIds.join(', ');
  if (type === 'Line') {
    if (description === undefined) {
      return `// eslint-disable-next-line ${ruleList}`;
    } else {
      return `// eslint-disable-next-line ${ruleList} -- ${description}`;
    }
  } else {
    if (description === undefined) {
      return `/* eslint-disable-next-line ${ruleList} */`;
    } else {
      return `/* eslint-disable-next-line ${ruleList} -- ${description} */`;
    }
  }
}
