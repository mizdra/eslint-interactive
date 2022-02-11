import { Rule } from 'eslint';

/**
 * @file This is a rule for testing purposes.
 */

export type ApplyFixesRuleOption = Rule.Fix[];

export const preferAdditionShorthandRule: Rule.RuleModule = {
  meta: {
    type: 'suggestion',
    // @ts-ignore
    hasSuggestions: true,
  },
  create(context: Rule.RuleContext) {
    return {
      // eslint-disable-next-line @typescript-eslint/naming-convention
      AssignmentExpression: (node) => {
        if (node.left.type !== 'Identifier') return;
        const leftIdentifier = node.left;
        if (node.right.type !== 'BinaryExpression') return;
        const rightBinaryExpression = node.right;
        if (rightBinaryExpression.operator !== '+') return;
        if (rightBinaryExpression.left.type !== 'Identifier') return;
        const rightIdentifier = rightBinaryExpression.left;
        if (leftIdentifier.name !== rightIdentifier.name) return;
        if (rightBinaryExpression.right.type !== 'Literal' || rightBinaryExpression.right.value !== 1) return;

        context.report({
          node,
          message: 'The addition method is redundant.',
          suggest: [
            {
              desc: 'Use `val += 1` instead.',
              fix: function (fixer) {
                return fixer.replaceText(node, `${leftIdentifier.name} += 1`);
              },
            },
            {
              desc: 'Use `val++` instead.',
              fix: function (fixer) {
                return fixer.replaceText(node, `${leftIdentifier.name}++`);
              },
            },
            {
              desc: 'Use `++val` instead.',
              fix: function (fixer) {
                return fixer.replaceText(node, `++${leftIdentifier.name}`);
              },
            },
          ],
        });
      },
    };
  },
};
