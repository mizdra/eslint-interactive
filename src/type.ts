import type { ESLint } from 'eslint';

/** The config of eslint-interactive */
export type Config = ESLint.Options & {
  patterns: string[];
  formatterName?: string | undefined;
  quiet?: boolean | undefined;
};
