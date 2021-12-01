import { RuleTester } from 'eslint';
import rule, { AddDisableCommentPerFileOption } from '../../src/rules/add-disable-comment-per-file';
import { fakeLintMessage, fakeLintResult } from '../test-util/eslint';

const ruleTester = new RuleTester({ parserOptions: { ecmaVersion: 2020, ecmaFeatures: { jsx: true } } });

const TARGET_FILENAME = 'file.js';
const OTHER_FILENAME = 'other.js';

function validCase(args: { code: string[]; option: AddDisableCommentPerFileOption }): RuleTester.ValidTestCase {
  return {
    code: args.code.join('\n'),
    filename: TARGET_FILENAME,
    options: [args.option],
  };
}

function invalidCase(args: {
  code: string[];
  output: string[];
  option: AddDisableCommentPerFileOption;
}): RuleTester.InvalidTestCase {
  return {
    code: args.code.join('\n'),
    output: args.output.join('\n'),
    errors: [{ message: 'add-disable-comment-per-file' }],
    filename: TARGET_FILENAME,
    options: [args.option],
  };
}

ruleTester.run('add-disable-comment-per-file', rule, {
  invalid: [
    // basic
    invalidCase({
      code: ['val;'],
      output: ['/* eslint-disable a */', 'val;'],
      option: {
        results: [
          fakeLintResult({
            filePath: TARGET_FILENAME,
            messages: [
              fakeLintMessage({
                ruleId: 'a',
              }),
              fakeLintMessage({
                ruleId: 'b',
              }),
            ],
          }),
        ],
        ruleIds: ['a'],
      },
    }),
    // 複数の rule を同時に disable できる
    invalidCase({
      code: ['val;'],
      output: ['/* eslint-disable a, b */', 'val;'],
      option: {
        results: [
          fakeLintResult({
            filePath: TARGET_FILENAME,
            messages: [
              fakeLintMessage({
                ruleId: 'a',
              }),
              fakeLintMessage({
                ruleId: 'b',
              }),
            ],
          }),
        ],
        ruleIds: ['a', 'b'],
      },
    }),
    // 既に disable comment が付いている場合は、末尾に足す
    invalidCase({
      code: ['/* eslint-disable semi */', 'val;'],
      output: ['/* eslint-disable semi, a */', 'val;'],
      option: {
        results: [
          fakeLintResult({
            filePath: TARGET_FILENAME,
            messages: [
              fakeLintMessage({
                ruleId: 'a',
              }),
            ],
          }),
        ],
        ruleIds: ['a'],
      },
    }),
    // disable description があっても disable できる
    invalidCase({
      code: ['/* eslint-disable semi -- comment */', 'val;'],
      output: ['/* eslint-disable semi, a -- comment */', 'val;'],
      option: {
        results: [
          fakeLintResult({
            filePath: TARGET_FILENAME,
            messages: [
              fakeLintMessage({
                ruleId: 'a',
              }),
            ],
          }),
        ],
        ruleIds: ['a'],
      },
    }),
    // disable description を追加できる
    invalidCase({
      code: ['/* eslint-disable semi */', 'val;'],
      output: ['/* eslint-disable semi, a -- comment */', 'val;'],
      option: {
        results: [
          fakeLintResult({
            filePath: TARGET_FILENAME,
            messages: [
              fakeLintMessage({
                ruleId: 'a',
              }),
            ],
          }),
        ],
        ruleIds: ['a'],
        description: 'comment',
      },
    }),
    // 既に disable description があるコメントに対しても disable description を追加できる
    invalidCase({
      code: ['/* eslint-disable semi -- foo */', 'val;'],
      output: ['/* eslint-disable semi, a -- foo, bar */', 'val;'],
      option: {
        results: [
          fakeLintResult({
            filePath: TARGET_FILENAME,
            messages: [
              fakeLintMessage({
                ruleId: 'a',
              }),
            ],
          }),
        ],
        ruleIds: ['a'],
        description: 'bar',
      },
    }),
    // `eslint-disable` has precedence over `@ts-check`
    invalidCase({
      code: ['// @ts-check', 'val;'],
      output: ['/* eslint-disable a */', '// @ts-check', 'val;'],
      option: {
        results: [
          fakeLintResult({
            filePath: TARGET_FILENAME,
            messages: [
              fakeLintMessage({
                ruleId: 'a',
              }),
            ],
          }),
        ],
        ruleIds: ['a'],
      },
    }),
    // The shebang has precedence over `eslint-disable`
    invalidCase({
      code: ['#!/usr/bin/env node', 'val;'],
      output: ['#!/usr/bin/env node', '/* eslint-disable a */', 'val;'],
      option: {
        results: [
          fakeLintResult({
            filePath: TARGET_FILENAME,
            messages: [
              fakeLintMessage({
                ruleId: 'a',
              }),
            ],
          }),
        ],
        ruleIds: ['a'],
      },
    }),
  ],
  valid: [
    // 他のファイル向けの disable は無視される
    validCase({
      code: ['val;'],
      option: {
        results: [
          fakeLintResult({
            filePath: OTHER_FILENAME,
            messages: [
              fakeLintMessage({
                ruleId: 'a',
              }),
            ],
          }),
        ],
        ruleIds: ['a'],
      },
    }),
  ],
});
