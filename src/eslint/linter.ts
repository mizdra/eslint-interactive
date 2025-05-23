// forked from: https://github.com/eslint/eslint/blob/d191bdd67214c33e65bd605e616ca7cc947fd045/lib/linter/linter.js
// I wanted a customized `linter.verifyAndFix`, so I forked the original `linter.verifyAndFix`.

/**
 * @fileoverview Main Linter Class
 * @author Gyandeep Singh
 * @author aladdin-add
 */

import type { Rule } from 'eslint';
import type { FixContext } from '../fix/index.js';
import { getLastSourceCode } from '../plugin.js';
import { ruleFixer } from './rule-fixer.js';
import { SourceCodeFixer } from './source-code-fixer.js';
import type { FlatESLint, LegacyESLint } from './use-at-your-own-risk.js';

const MAX_AUTOFIX_PASSES = 10;

type FixedResult = {
  fixed: boolean;
  output: string;
};

/**
 * Performs multiple autofix passes over the text until as many fixes as possible have been applied.
 * @param linter
 */

export async function verifyAndFix(
  eslint: InstanceType<typeof FlatESLint> | InstanceType<typeof LegacyESLint>,
  text: string,
  filePath: string,
  ruleIds: string[],
  fixCreator: (context: FixContext) => Rule.Fix[],
): Promise<FixedResult> {
  let fixedResult: FixedResult;
  let fixed = false;
  let passNumber = 0;
  let currentText = text;

  /**
   * This loop continues until one of the following is true:
   *
   * 1. No more fixes have been applied.
   * 2. Ten passes have been made.
   *
   * That means anytime a fix is successfully applied, there will be another pass.
   * Essentially, guaranteeing a minimum of two passes.
   */
  do {
    passNumber++;

    // eslint-disable-next-line no-await-in-loop
    const results = await eslint.lintText(currentText, { filePath });
    const messages = results
      .flatMap((result) => result.messages)
      .filter((message) => message.ruleId && ruleIds.includes(message.ruleId));
    const sourceCode = getLastSourceCode();
    if (!sourceCode) throw new Error('Failed to get the last source code.');

    // Create `Rule.Fix[]`
    const fixContext: FixContext = {
      filename: filePath,
      sourceCode,
      messages,
      ruleIds,
      fixer: ruleFixer,
    };
    const fixes = fixCreator(fixContext);

    fixedResult = SourceCodeFixer.applyFixes(
      currentText,
      fixes.map((fix) => {
        return {
          ruleId: 'eslint-interactive/fix',
          severity: 2,
          message: 'fix',
          line: 0,
          column: 0,
          fix,
        };
      }),
      true,
    );

    /**
     * stop if there are any syntax errors.
     * 'fixedResult.output' is a empty string.
     */
    if (messages.length === 1 && messages[0] && messages[0].fatal) {
      break;
    }

    // keep track if any fixes were ever applied - important for return value
    fixed = fixed || fixedResult.fixed;

    // update to use the fixed output instead of the original text
    currentText = fixedResult.output;
  } while (fixedResult.fixed && passNumber < MAX_AUTOFIX_PASSES);

  // ensure the last result properly reflects if fixes were done
  fixedResult.fixed = fixed;
  fixedResult.output = currentText;

  return fixedResult;
}
