import { runAsWorker } from 'synckit';

runAsWorker(async (path: string) => {
  const module = await import(path);
  // eslint-disable-next-line @typescript-eslint/no-unsafe-return
  return module;
});
