import { selectAction, type SelectActionArgs } from './select-action.js';
import { selectRuleIds, type SelectRuleIdsArgs } from './select-rule-ids.js';
import { SelectNextStepArgs } from './select-to-continue.js';

export { selectAction, type SelectActionArgs, selectRuleIds, type SelectRuleIdsArgs };
export { lint } from './lint.js';
export { selectToContinue } from './select-to-continue.js';

/**
 * The return type when calling a scene function.
 * Indicates which scene to jump to next.
 */
export type NextScene =
  | { name: 'lint' }
  | { name: 'selectRuleIds'; args: SelectRuleIdsArgs }
  | { name: 'selectAction'; args: SelectActionArgs }
  | { name: 'selectToContinue'; args: SelectNextStepArgs }
  | { name: 'exit' };
