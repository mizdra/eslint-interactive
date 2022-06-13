import { Rule } from 'eslint';
import { FixContext } from '../index.js';

export type FixToConvertErrorToWarningPerFileArgs = {
  description?: string;
};

function generateFix(context: FixContext, description?: string): Rule.Fix | null {
  throw new Error('Not implemented');
}

/**
 * Create fix to convert error to warning per file.
 */
export function createFixToConvertErrorToWarningPerFile(
  context: FixContext,
  args: FixToConvertErrorToWarningPerFileArgs,
): Rule.Fix[] {
  const fix = generateFix(context, args.description);
  return fix ? [fix] : [];
}
