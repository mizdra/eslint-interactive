import { ESLint } from 'eslint';
import { unique } from './array';
import { notEmpty } from './filter';

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
