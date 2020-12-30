import { ESLint } from 'eslint';
import { formatByFiles } from './format-by-files';
import { formatByRules } from './format-by-rules';

const formatter: ESLint.Formatter['format'] = (results, data) => {
  return formatByFiles(results) + '\n' + formatByRules(results, data);
};

// eslint-disable-next-line import/no-default-export
export default formatter;
