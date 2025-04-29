// @ts-check

/** @type {import('eslint').Rule.RuleModule} */
module.exports = {
  create(context) {
    return {
      BinaryExpression: (node) => {
        if (node.operator === '**') {
          context.report({
            node,
            message: 'Ban exponentiation operator',
          });
        }
      },
    };
  },
};
