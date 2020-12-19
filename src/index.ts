#!/usr/bin/env node

import { prompt } from 'enquirer';
import { ESLint } from 'eslint';
import yargs from 'yargs/yargs';
import { format as formatByErrorAndWarning } from './eslint-formatter/stats/byErrorAndWarning';
import { format as formatBySummary } from './eslint-formatter/summary';

const argv = yargs(process.argv.slice(2)).argv;
// NOTE: convert `string` type because yargs convert `'10'` (`string` type) into `10` (`number` type)
// and `lintFiles` only accepts `string[]`.
const patterns = argv._.map((pattern) => pattern.toString());

(async function main() {
  const eslint = new ESLint({});

  const results = await eslint.lintFiles(patterns);

  const formattedTextBySummary = formatBySummary(results);
  const formattedTextByErrorAndWarning = formatByErrorAndWarning(results);
  console.log(formattedTextBySummary);

  const choices = formattedTextByErrorAndWarning.split('\n');
  const answers = await prompt<{ rules: string }>([
    {
      name: 'rules',
      type: 'multiselect',
      message: 'Which rule(s) would you like to fix?',
      choices,
    },
  ]);
  console.info(answers);
})().catch((error) => {
  process.exitCode = 1;
  console.error(error);
});
