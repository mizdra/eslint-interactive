#!/usr/bin/env node

import { ESLint, Linter } from 'eslint';
import yargs from 'yargs/yargs';
import { fix, lint, showMessages } from './eslint';
import { calcFormattedChoices } from './eslint-formatter/stats';
import { format as formatBySummary } from './eslint-formatter/summary';
import { prompt } from './prompt';
import { calcRuleResults } from './stat';

const argv = yargs(process.argv.slice(2)).argv;
// NOTE: convert `string` type because yargs convert `'10'` (`string` type) into `10` (`number` type)
// and `lintFiles` only accepts `string[]`.
const patterns = argv._.map((pattern) => pattern.toString());

(async function main() {
  const { eslint, results, ruleIdChoices } = await lint(patterns);

  console.log(formatBySummary(results));

  const answers = await prompt(ruleIdChoices);

  if (answers.action === 'showMessages') {
    await showMessages(eslint, results, answers);
  } else if (answers.action === 'fix') {
    const {
      eslint: newESLint,
      results: newResults,
      ruleIdChoices: newRuleIdChoices,
    } = await fix(patterns, answers);
  }

  console.info(answers);
})().catch((error) => {
  process.exitCode = 1;
  console.error(error);
});
