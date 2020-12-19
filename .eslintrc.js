// @ts-check

/** @type import('eslint').Linter.BaseConfig */
module.exports = {
  root: true,
  extends: [
    // basic
    '@mizdra/mizdra',
    '@mizdra/mizdra/+typescript',
    '@mizdra/mizdra/+prettier',
  ],
  env: {
    node: true,
  },
};
