declare module 'stream-match' {
  const streamMatch: (stream: NodeJS.ReadableStream, pattern: string) => Promise<boolean>;
  export default streamMatch;
}
