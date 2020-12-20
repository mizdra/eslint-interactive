#!/usr/bin/env node

import { prompt } from 'enquirer';
import { ESLint, Linter } from 'eslint';
import yargs from 'yargs/yargs';
import { calcFormattedChoices } from './eslint-formatter/stats';
import { format as formatBySummary } from './eslint-formatter/summary';
import { calcRuleResults } from './stat';

function filterResultsByRuleId(
  results: ESLint.LintResult[],
  ruleIds: string[],
): ESLint.LintResult[] {
  return results.map((result) => {
    return {
      ...result,
      messages: result.messages.filter(
        (message) =>
          message.ruleId !== null && ruleIds.includes(message.ruleId),
      ),
    };
  });
}

const argv = yargs(process.argv.slice(2)).argv;
// NOTE: convert `string` type because yargs convert `'10'` (`string` type) into `10` (`number` type)
// and `lintFiles` only accepts `string[]`.
const patterns = argv._.map((pattern) => pattern.toString());

(async function main() {
  const eslint = new ESLint({});
  const results = await eslint.lintFiles(patterns);

  const linter = new Linter();
  const ruleNameToRuleModule = linter.getRules();

  console.log(formatBySummary(results));

  const ruleResults = calcRuleResults(results, ruleNameToRuleModule);
  const choices = calcFormattedChoices(ruleResults);

  const answers = await prompt<{
    ruleIds: string[];
    action: 'showMessages' | 'fix';
  }>([
    {
      name: 'ruleIds',
      type: 'multiselect',
      message: 'Which rule(s) would you like to do action?',
      choices,
    },
    {
      name: 'action',
      type: 'select',
      message: 'Which rule(s) would you like to fix?',
      choices: [
        { name: 'showMessages', message: 'Show error/warning messages' },
        { name: 'fix', message: 'Fix error/warning' },
      ],
    },
  ]);

  if (answers.action === 'showMessages') {
    const formatter = await eslint.loadFormatter('stylish');
    const resultText = formatter.format(
      filterResultsByRuleId(results, answers.ruleIds),
    );
    console.log(resultText);
  } else if (answers.action === 'fix') {
    const eslint = new ESLint({
      fix: (message) =>
        message.ruleId !== null && answers.ruleIds.includes(message.ruleId),
    });
    const results = await eslint.lintFiles(patterns);
    await ESLint.outputFixes(results);
    const formatter = await eslint.loadFormatter('stylish');
    const resultText = formatter.format(results);
    console.log(resultText);
  }

  console.info(answers);
})().catch((error) => {
  process.exitCode = 1;
  console.error(error);
});
