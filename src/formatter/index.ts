import { ESLint } from 'eslint';
import { formatByFiles } from './format-by-files.js';
import { formatByRules } from './format-by-rules.js';

export { takeRuleStatistics, type RuleStatistic } from './take-rule-statistics.js';

export const format: ESLint.Formatter['format'] = (results, data) => {
  return formatByFiles(results) + '\n' + formatByRules(results, data);
};
