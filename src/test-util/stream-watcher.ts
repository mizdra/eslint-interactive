import { Readable } from 'node:stream';

export function createStreamWatcher(stream: Readable) {
  let allData = '';
  let unconsumedData = '';
  stream.on('data', (data) => {
    allData += data.toString();
    unconsumedData += data.toString();
  });
  async function waitOnData(): Promise<void> {
    return new Promise((resolve) => {
      stream.once('data', () => {
        resolve();
      });
    });
  }
  return {
    match: async (matcher: RegExp) => {
      while (!unconsumedData.match(matcher)) {
        // eslint-disable-next-line no-await-in-loop
        await waitOnData();
      }
      const ret = unconsumedData;
      unconsumedData = '';
      return ret;
    },
    getAllData() {
      return allData;
    },
  };
}
