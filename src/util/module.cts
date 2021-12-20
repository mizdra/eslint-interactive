import { createSyncFn } from 'synckit';

export function importSync<T>(path: string): T {
  const importSyncImpl = createSyncFn(require.resolve('./worker.js'));
  const module = importSyncImpl(path);
  // eslint-disable-next-line @typescript-eslint/no-unsafe-return
  return module;
}
