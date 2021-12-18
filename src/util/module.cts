import deasync from 'deasync';

export function importSync<T>(importer: () => Promise<T>): T {
  const importSyncImpl = deasync<T>((cb) => {
    importer()
      .then((module) => {
        cb(null, module);
      })
      .catch((error) => {
        // eslint-disable-next-line @typescript-eslint/no-unsafe-argument, @typescript-eslint/no-explicit-any
        cb(error, null as any);
      });
  });
  const module = importSyncImpl();
  if (module === null) {
    throw new Error('Failed to import module');
  }
  return module;
}
