import chalk from 'chalk';
import { ESLint } from 'eslint';
import table from 'text-table';

export function printLintSummary(results: ESLint.LintResult[]): void {
  const errorColor = 'red';
  const warningColor = 'yellow';

  let errorCount = 0;
  let failureCount = 0;
  let passCount = 0;
  let warningCount = 0;

  results.forEach(function (result) {
    const messages = result.messages;

    if (messages.length === 0) {
      passCount++;
    } else {
      failureCount++;
      warningCount += result.warningCount;
      errorCount += result.errorCount;
    }
  });

  const fileCount = passCount + failureCount;

  const summaryLineArray = [
    chalk.bold(`${fileCount} file(s) checked.`),
    chalk.bold(`${passCount} passed.`),
    chalk.bold(`${failureCount} failed.`),
  ];

  if (warningCount || errorCount) {
    summaryLineArray.push(chalk[warningColor].bold(`${warningCount} file(s).`));
    summaryLineArray.push(chalk[errorColor].bold(`${errorCount} file(s)`));
  }

  const output = table([summaryLineArray]) + '\n';

  console.log(output);
}
