const { delimiter } = require('path');

const modules =
  process.env.NODE_PATH && process.env.NODE_PATH.length > 0
    ? [...process.env.NODE_PATH.split(delimiter), 'node_modules']
    : ['node_modules'];

// ref: https://github.com/facebook/jest/issues/9771#issuecomment-974750103
const importResolver = require('enhanced-resolve').create.sync({
  modules,
  conditionNames: ['import', 'node', 'default'],
  extensions: ['.js', '.json', '.node', '.ts'],
});
const requireResolver = require('enhanced-resolve').create.sync({
  modules,
  conditionNames: ['require', 'node', 'default'],
  extensions: ['.js', '.json', '.node', '.ts'],
});

module.exports = function (request, options) {
  let resolver = requireResolver;
  if (options.conditions?.includes('import')) {
    resolver = importResolver;
  }
  return resolver(options.basedir, request);
};
