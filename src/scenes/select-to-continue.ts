import { promptToInputContinue } from '../cli/prompt.js';
import { NextScene } from '../types.js';

/**
 * Run the scene where a user select to continue running the program or not.
 */
export async function selectToContinue(): Promise<NextScene> {
  console.log();
  const isContinue = await promptToInputContinue();
  if (!isContinue) return { name: 'exit' };
  console.log();
  console.log('─'.repeat(process.stdout.columns));
  console.log();
  return { name: 'lint' };
}
