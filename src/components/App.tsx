import { Text } from 'ink';
import React, { Suspense } from 'react';
import { AppContent } from './App/AppContent';

export type AppProps = {
  patterns: string[];
};

export function App({ patterns }: AppProps) {
  return (
    <Suspense fallback={<Text>loading...</Text>}>
      <AppContent patterns={patterns}></AppContent>
    </Suspense>
  );
}
