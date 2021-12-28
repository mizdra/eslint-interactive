#!/usr/bin/env -S node -r source-map-support/register

import { run } from '../dist/index.js';

run({
  argv: process.argv,
}).catch((error) => {
  process.exitCode = 1;
  console.error(error);
});
