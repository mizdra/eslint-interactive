// @ts-check

const { dirname, resolve } = require('path');
const resolveFrom = require('resolve-from');

/**
 * @typedef {{
 * basedir: string;
 * conditions?: Array<string>;
 * defaultResolver: (path: string, options: ResolverOptions) => string;
 * extensions?: Array<string>;
 * moduleDirectory?: Array<string>;
 * paths?: Array<string>;
 * packageFilter?: (pkg: any, file: string, dir: string) => any;
 * pathFilter?: (pkg: any, path: string, relativePath: string) => string;
 * rootDir?: string;
 * }} ResolverOptions
 * */

/** @type {(path: string, options: ResolverOptions) => string} */
module.exports = (path, options) => {
  // workaround for https://github.com/facebook/jest/issues/12270
  if (path === '#ansi-styles' || path === '#supports-color') {
    const chalkRoot = resolve(dirname(resolveFrom(options.basedir, 'chalk')), '../');
    const subPkgName = path.slice(1);
    return `${chalkRoot}/source/vendor/${subPkgName}/index.js`;
  }
  return options.defaultResolver(path, options);
};
