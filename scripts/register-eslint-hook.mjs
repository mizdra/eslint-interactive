// Hook to switch the version of eslint being imported
// eslint-disable-next-line n/no-unsupported-features/node-builtins
import { registerHooks } from 'node:module';

const version = process.env['ESLINT_VERSION'];

if (version) {
  registerHooks({
    resolve(specifier, context, nextResolve) {
      if (specifier === 'eslint' || specifier.startsWith('eslint/')) {
        return nextResolve(specifier.replace('eslint', `eslint-v${version}`), context);
      }
      return nextResolve(specifier, context);
    },
  });
}
