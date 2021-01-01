import { ESLint } from 'eslint';
import { formatByFiles } from './format-by-files';
import { formatByRules } from './format-by-rules';

export const format: ESLint.Formatter['format'] = (results, data) => {
  return formatByFiles(results) + '\n' + formatByRules(results, data);
};
