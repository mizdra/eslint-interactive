import {
  createTransformToMakeFixableAndFix,
  TransformToMakeFixableAndFixArgs,
} from '../../../src/plugin/transforms/make-fixable-and-fix.js';
import { TransformTester } from '../../test-util/transform-tester.js';

const tester = new TransformTester<TransformToMakeFixableAndFixArgs>(
  createTransformToMakeFixableAndFix,
  {
    fixableMaker: (_message, node) => {
      if (!node || !node.range) return null;
      return {
        range: [node.range[0], node.range[0]],
        text: '/* test */',
      };
    },
  },
  { parserOptions: { ecmaVersion: 2020, ecmaFeatures: { jsx: true } } },
);

describe('make-fixable-and-fix', () => {
  test('basic', () => {
    expect(
      tester.test({
        code: 'const a = 1;',
        ruleIdsToTransform: ['no-unused-vars'],
        args: {
          fixableMaker: (_message, node) => {
            if (!node || !node.range) return null;
            return { range: [node.range[0], node.range[0]], text: '_' };
          },
        },
      }),
    ).toMatchInlineSnapshot(`"const _a = 1;"`);
  });
  test('can process multiple messages at once', () => {
    expect(
      tester.test({
        code: ['const a = 1;', 'const b = 2;'],
        ruleIdsToTransform: ['no-unused-vars'],
        args: {
          fixableMaker: (_message, node) => {
            if (!node || !node.range) return null;
            return { range: [node.range[0], node.range[0]], text: '_' };
          },
        },
      }),
    ).toMatchInlineSnapshot(`
      "const _a = 1;
      const _b = 2;"
    `);
  });
  test('can process messages of multiple rules at once', () => {
    expect(
      tester.test({
        code: ['const a = 1;', 'let b = 2;', 'b++;', 'console.log(b);'],
        ruleIdsToTransform: ['no-unused-vars', 'no-plusplus'],
        args: {
          fixableMaker: (message, node) => {
            if (!node || !node.range) return null;
            if (message.ruleId === 'no-unused-vars') {
              return { range: [node.range[0], node.range[0]], text: '_' };
            } else if (message.ruleId === 'no-plusplus') {
              return { range: [node.range[1] - 2, node.range[1]], text: ' += 1' };
            } else {
              return null;
            }
          },
        },
      }),
    ).toMatchInlineSnapshot(`
      "const _a = 1;
      let b = 2;
      b += 1;
      console.log(b);"
    `);
  });
  test('can process messages on the same line', () => {
    expect(
      tester.test({
        code: ['const a = 1; const b = 2;'],
        ruleIdsToTransform: ['no-unused-vars'],
        args: {
          fixableMaker: (_message, node) => {
            if (!node || !node.range) return null;
            return { range: [node.range[0], node.range[0]], text: '_' };
          },
        },
      }),
    ).toMatchInlineSnapshot(`"const _a = 1; const _b = 2;"`);
  });
  test('`fixableMaker` receives the message and node.', () => {
    tester.test({
      code: ['const a = 1;'],
      ruleIdsToTransform: ['no-unused-vars'],
      args: {
        fixableMaker: (message, node) => {
          expect({
            message,
            node: node,
          }).toMatchSnapshot();
          return null;
        },
      },
    });
  });
  test('node is null if message is not associated with a node', () => {
    tester.test({
      code: ['// this is comment'],
      ruleIdsToTransform: ['capitalized-comments'],
      args: {
        fixableMaker: (_message, node) => {
          expect(node).toBeNull();
          return null;
        },
      },
    });
  });
  test('do not process if `fixableMaker` returns null', () => {
    expect(
      tester.test({
        code: 'const a = 1;',
        ruleIdsToTransform: ['no-unused-vars'],
        args: {
          fixableMaker: () => null,
        },
      }),
    ).toMatchInlineSnapshot(`null`);
  });
});
