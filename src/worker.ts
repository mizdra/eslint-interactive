import { parentPort } from 'worker_threads';
import { expose } from 'comlink';
import nodeEndpoint from 'comlink/dist/umd/node-adapter';
import { Core } from './core';

if (parentPort === null) throw new Error('This module must be started on a worker.');

expose(Core, nodeEndpoint(parentPort));
