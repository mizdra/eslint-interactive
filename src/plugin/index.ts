import { transformRule, type TransformRuleOption } from './transform-rule.js';
export {
  type FixableMaker,
  type SuggestionFilter,
  type TransformToApplySuggestionsArgs,
  type TransformToDisablePerFileArgs,
  type TransformToDisablePerLineArgs,
  type TransformToMakeFixableAndFixArgs,
} from './transforms/index.js';

export { TransformRuleOption };

export const eslintInteractivePlugin = {
  rules: {
    transform: transformRule,
  },
};
