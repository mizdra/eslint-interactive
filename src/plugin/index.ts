import { transformRule, type TransformRuleOption } from './transform-rule.js';

export { TransformRuleOption };

export const eslintInteractivePlugin = {
  rules: {
    transform: transformRule,
  },
};
