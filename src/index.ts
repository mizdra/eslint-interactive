#!/usr/bin/env node

import { prompt } from 'enquirer';
import { ESLint } from 'eslint';
import yargs from 'yargs/yargs';

const argv = yargs(process.argv.slice(2)).argv;
// NOTE: convert `string` type because yargs convert `'10'` (`string` type) into `10` (`number` type)
// and `lintFiles` only accepts `string[]`.
const patterns = argv._.map((pattern) => pattern.toString());

(async function main() {
  const eslint = new ESLint({});

  const results = await eslint.lintFiles(patterns);

  const formatter = await eslint.loadFormatter('stylish');
  const resultText = formatter.format(results);

  console.log(resultText);

  const choices = ['a', 'b', 'c'];
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
