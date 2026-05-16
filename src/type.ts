import type { ESLint } from 'eslint';

export type SortField = 'rule' | 'error' | 'warning' | 'fixable' | 'suggestions';
export type SortOrder = 'asc' | 'desc';
export type FilterCriterion = 'fixable' | 'has-suggestions';

/** The config of eslint-interactive */
export type Config = ESLint.Options & {
  patterns: string[];
  formatterName?: string | undefined;
  quiet?: boolean | undefined;
  sort?: SortField | undefined;
  sortOrder?: SortOrder | undefined;
  filters?: FilterCriterion[] | undefined;
};
