#!/usr/bin/env -S node -r source-map-support/register --unhandled-rejections=strict

import { run } from '../dist/index.js';

run({
  argv: process.argv,
}).catch((error) => {
  console.error(error);
  process.exit(1);
});
