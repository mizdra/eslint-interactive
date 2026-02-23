import { parentPort } from 'node:worker_threads';
import { expose, proxy } from 'comlink';
import nodeEndpoint from 'comlink/dist/esm/node-adapter.mjs';
import { Core } from './core.js';
import type { Config } from './type.js';

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
  formatResultSummary(...args: Parameters<Core['formatResultSummary']>): ReturnType<Core['formatResultSummary']> {
    return this.core.formatResultSummary(...args);
  }
  getSortedRuleIdsInResults(
    ...args: Parameters<Core['getSortedRuleIdsInResults']>
  ): ReturnType<Core['getSortedRuleIdsInResults']> {
    return this.core.getSortedRuleIdsInResults(...args);
  }
  async formatResultDetails(...args: Parameters<Core['formatResultDetails']>): ReturnType<Core['formatResultDetails']> {
    return this.core.formatResultDetails(...args);
  }
  async applyAutoFixes(...args: Parameters<Core['applyAutoFixes']>): ReturnType<Core['applyAutoFixes']> {
    return proxy(await this.core.applyAutoFixes(...args));
  }
  async disablePerLine(...args: Parameters<Core['disablePerLine']>): ReturnType<Core['disablePerLine']> {
    return proxy(await this.core.disablePerLine(...args));
  }
  async disablePerFile(...args: Parameters<Core['disablePerFile']>): ReturnType<Core['disablePerFile']> {
    return proxy(await this.core.disablePerFile(...args));
  }
  async convertErrorToWarningPerFile(
    ...args: Parameters<Core['convertErrorToWarningPerFile']>
  ): ReturnType<Core['convertErrorToWarningPerFile']> {
    return proxy(await this.core.convertErrorToWarningPerFile(...args));
  }
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
expose(SerializableCore, (nodeEndpoint as any)(parentPort));
