#!/usr/bin/env node

import { render } from 'ink';
import React from 'react';

import yargs from 'yargs/yargs';
import { App } from './components/App';
import { fix, lint, showMessages } from './eslint/command';
import { prompt } from './terminal/prompt';
import { RuleStatistic } from './types';

const argv = yargs(process.argv.slice(2)).argv;
// NOTE: convert `string` type because yargs convert `'10'` (`string` type) into `10` (`number` type)
// and `lintFiles` only accepts `string[]`.
const patterns = argv._.map((pattern) => pattern.toString());

// (async function main() {
//   // eslint-disable-next-line no-constant-condition
//   while (true) {
//     let { eslint, results, ruleIdChoices } = await lint(patterns);

//     if (ruleIdChoices.length === 0) break;

//     const answers = await prompt(ruleIdChoices);

//     if (answers.action === 'showMessages') {
//       await showMessages(eslint, results, answers);
//     } else if (answers.action === 'fix') {
//       const {
//         eslint: newESLint,
//         results: newResults,
//         ruleIdChoices: newRuleIdChoices,
//       } = await fix(patterns, answers);
//       eslint = newESLint;
//       results = newResults;
//       ruleIdChoices = newRuleIdChoices;
//     }
//     console.log('-'.repeat(process.stdout.columns));
//   }
// })().catch((error) => {
//   process.exitCode = 1;
//   console.error(error);
// });

(async () => {
  while (true) {
    const { waitUntilExit } = render(<App patterns={patterns} />);
    await waitUntilExit();
  }
})().catch((error) => {
  process.exitCode = 1;
  console.error(error);
});
