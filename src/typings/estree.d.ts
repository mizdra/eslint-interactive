declare module 'estree' {
  import { BaseNode, BaseExpression } from 'estree';
  interface NodeMap {
    JSXText: JSXText;
  }
  interface JSXText extends BaseNode, BaseExpression {
    type: 'JSXText';
  }
}

export {};
