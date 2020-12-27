#!/usr/bin/env node

import yargs from 'yargs/yargs';
import { fix, lint, showMessages } from './eslint/command';
import { printLintSummary } from './terminal/print-lint-summary';
import { printTable } from './terminal/print-table';
import { prompt } from './terminal/prompt';
import { Choice } from './types';

const argv = yargs(process.argv.slice(2)).argv;
// NOTE: convert `string` type because yargs convert `'10'` (`string` type) into `10` (`number` type)
// and `lintFiles` only accepts `string[]`.
const patterns = argv._.map((pattern) => pattern.toString());

(async function main() {
  // eslint-disable-next-line no-constant-condition
  while (true) {
    let { eslint, results, ruleStatistics } = await lint(patterns);

    if (ruleStatistics.length === 0) break;

    printLintSummary(results);
    printTable(ruleStatistics);

    const ruleIds = ruleStatistics.map((ruleStatistic) => ruleStatistic.ruleId);

    const answers = await prompt(ruleIds);

    if (answers.action === 'showMessages') {
      await showMessages(eslint, results, answers);
    } else if (answers.action === 'fix') {
      const {
        eslint: newESLint,
        results: newResults,
        ruleStatistics: newRuleStatistics,
      } = await fix(patterns, answers);
      eslint = newESLint;
      results = newResults;
      ruleStatistics = newRuleStatistics;
    }
    console.log('-'.repeat(process.stdout.columns));
  }
})().catch((error) => {
  process.exitCode = 1;
  console.error(error);
});
