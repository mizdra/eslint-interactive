import type { ESLint } from 'eslint';

export type SortField = 'rule' | 'error' | 'warning' | 'fixable' | 'suggestions';
export type SortOrder = 'asc' | 'desc';

/** The config of eslint-interactive */
export type Config = ESLint.Options & {
  patterns: string[];
  formatterName?: string | undefined;
  quiet?: boolean | undefined;
  sort?: SortField | undefined;
  sortOrder?: SortOrder | undefined;
};
