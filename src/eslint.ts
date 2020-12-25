import { ESLint, Linter } from 'eslint';
import { calcRuleResults } from './calc-rule-results';
import { calcFormattedChoices } from './eslint-formatter/stats';
import { format } from './eslint-formatter/summary';
import { Answers } from './prompt';

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

export async function lint(patterns: string[]) {
  const eslint = new ESLint({});
  const results = await eslint.lintFiles(patterns);

  const linter = new Linter();
  const ruleNameToRuleModule = linter.getRules();

  const ruleResults = calcRuleResults(results, ruleNameToRuleModule);
  const ruleIdChoices = calcFormattedChoices(ruleResults);

  console.log(format(results));

  return { eslint, results, ruleIdChoices };
}

export async function showMessages(
  eslint: ESLint,
  results: ESLint.LintResult[],
  answers: Answers,
) {
  const formatter = await eslint.loadFormatter('stylish');
  const resultText = formatter.format(
    filterResultsByRuleId(results, answers.ruleIds),
  );
  console.log(resultText);
}

export async function fix(patterns: string[], answers: Answers) {
  const eslint = new ESLint({
    fix: (message) =>
      message.ruleId !== null && answers.ruleIds.includes(message.ruleId),
  });
  const results = await eslint.lintFiles(patterns);
  await ESLint.outputFixes(results);

  const linter = new Linter();
  const ruleNameToRuleModule = linter.getRules();

  const ruleResults = calcRuleResults(results, ruleNameToRuleModule);
  const ruleIdChoices = calcFormattedChoices(ruleResults);

  return { eslint, results, ruleIdChoices };
}
