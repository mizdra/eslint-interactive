declare module 'estree' {
  import type { BaseExpression, BaseNode } from 'estree';
  interface JSXText extends BaseNode, BaseExpression {
    type: 'JSXText';
  }
  interface NodeMap {
    JSXText: JSXText;
  }
}

export {};
