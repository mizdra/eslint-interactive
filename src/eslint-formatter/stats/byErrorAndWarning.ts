import { ESLint } from 'eslint';
import { getObjectOutput } from './util/chart';
import { byRule } from './util/stats';

export function format(
  results: ESLint.LintResult[],
  _data?: ESLint.LintResultData,
): string {
  const obj = byRule(results);
  return getObjectOutput(obj, process.stdout.columns);
}
