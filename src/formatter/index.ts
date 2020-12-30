import { ESLint } from 'eslint';
import { printLintSummary } from './print-lint-summary';
import { printTable } from './print-table';
import { takeStatisticsForEachRule } from './take-statistics';

const formatter: ESLint.Formatter['format'] = (results, data) => {
  const statistics = takeStatisticsForEachRule(results);

  let text = '';
  text += printLintSummary(results);
  text += printTable(statistics, data.rulesMeta);

  return text;
};

// eslint-disable-next-line import/no-default-export
export default formatter;
