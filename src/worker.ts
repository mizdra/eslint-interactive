import { parentPort } from 'worker_threads';
import { expose } from 'comlink';
import nodeEndpoint from 'comlink/dist/umd/node-adapter';
import { ESLint } from 'eslint';
import { Core } from './core';
import { SuggestionFilter } from './transforms/apply-suggestions';
import { FixableMaker } from './transforms/make-fixable-and-fix';

if (parentPort === null) throw new Error('This module must be started on a worker.');

export class EnhancedCore extends Core {
  async applySuggestions(
    results: ESLint.LintResult[],
    ruleIds: string[],
    filter: SuggestionFilter | string,
  ): Promise<void> {
    const fn = typeof filter === 'string' ? (eval(filter) as SuggestionFilter) : filter;
    return super.applySuggestions(results, ruleIds, fn);
  }
  async makeFixableAndFix(
    results: ESLint.LintResult[],
    ruleIds: string[],
    fixableMaker: FixableMaker | string,
  ): Promise<void> {
    const fn = typeof fixableMaker === 'string' ? (eval(fixableMaker) as FixableMaker) : fixableMaker;
    return super.makeFixableAndFix(results, ruleIds, fn);
  }
}

expose(EnhancedCore, nodeEndpoint(parentPort));
