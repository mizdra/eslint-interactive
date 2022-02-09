import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import yargs from 'yargs';
import { Config } from '../core.js';

/** Parse argv into the config object of eslint-interactive */
export function parseArgv(argv: string[]): Config {
  const pkg = JSON.parse(
    readFileSync(join(dirname(fileURLToPath(import.meta.url)), '..', '..', 'package.json'), 'utf8'),
  );

  const parsedArgv = yargs(argv.slice(2))
    .version(pkg.version)
    .usage('$0 [file.js] [dir]')
    .option('rulesdir', {
      type: 'array',
      describe: 'Use additional rules from this directory',
    })
    .nargs('rulesdir', 1)
    .option('ext', {
      type: 'array',
      describe: 'Specify JavaScript file extensions',
    })
    .nargs('ext', 1)
    .option('format', {
      type: 'string',
      describe: 'Specify the format to be used for the `Display problem messages` action',
      default: 'codeframe',
    }).argv;
  // NOTE: convert `string` type because yargs convert `'10'` (`string` type) into `10` (`number` type)
  // and `lintFiles` only accepts `string[]`.
  const patterns = parsedArgv._.map((pattern) => pattern.toString());
  const rulePaths = parsedArgv.rulesdir?.map((rulePath) => rulePath.toString());
  const extensions = parsedArgv.ext
    ?.map((extension) => extension.toString())
    // map '.js,.ts' into ['.js', '.ts']
    .flatMap((extension) => extension.split(','));
  const formatterName = parsedArgv.format;
  return { patterns, rulePaths, extensions, formatterName };
}
