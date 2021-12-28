import { parentPort } from 'worker_threads';
import { expose } from 'comlink';
// eslint-disable-next-line @typescript-eslint/no-require-imports
import nodeEndpoint = require('comlink/dist/umd/node-adapter');
import { ESLint } from 'eslint';
import { Core } from './core.js';
import { SuggestionFilter } from './transforms/apply-suggestions.js';
import { FixableMaker } from './transforms/make-fixable-and-fix.js';
import { Config } from './types.js';

/**
 * @file This is a wrapper module for using the Core API with comlink.
 */

if (parentPort === null) throw new Error('This module must be started on a worker.');

/**
 * This is a wrapper for using the Core API from comlink.
 *
 * The arguments of the methods wrapped in comlink must be serializable.
 * The methods in this class are serializable versions of the Core API methods.
 */
export class SerializableCore {
  readonly core: Core;
  constructor(config: Config) {
    this.core = new Core(config);
  }
  async lint(...args: Parameters<Core['lint']>): ReturnType<Core['lint']> {
    return this.core.lint(...args);
  }
  printSummaryOfResults(...args: Parameters<Core['printSummaryOfResults']>): ReturnType<Core['printSummaryOfResults']> {
    return this.core.printSummaryOfResults(...args);
  }
  async printDetailsOfResults(
    ...args: Parameters<Core['printDetailsOfResults']>
  ): ReturnType<Core['printDetailsOfResults']> {
    return this.core.printDetailsOfResults(...args);
  }
  async fix(...args: Parameters<Core['fix']>): ReturnType<Core['fix']> {
    return this.core.fix(...args);
  }
  async disablePerLine(...args: Parameters<Core['disablePerLine']>): ReturnType<Core['disablePerLine']> {
    return this.core.disablePerLine(...args);
  }
  async disablePerFile(...args: Parameters<Core['disablePerFile']>): ReturnType<Core['disablePerFile']> {
    return this.core.disablePerFile(...args);
  }
  async applySuggestions(
    results: ESLint.LintResult[],
    ruleIds: string[],
    filterScript: string,
  ): ReturnType<Core['applySuggestions']> {
    const filter = eval(filterScript) as SuggestionFilter;
    return this.core.applySuggestions(results, ruleIds, filter);
  }
  async makeFixableAndFix(
    results: ESLint.LintResult[],
    ruleIds: string[],
    fixableMakerScript: string,
  ): ReturnType<Core['makeFixableAndFix']> {
    const fixableMaker = eval(fixableMakerScript) as FixableMaker;
    return this.core.makeFixableAndFix(results, ruleIds, fixableMaker);
  }
}
// eslint-disable-next-line @typescript-eslint/no-explicit-any
expose(SerializableCore, (nodeEndpoint as any)(parentPort));
