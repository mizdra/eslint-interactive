import { Text } from 'ink';
import React, { Suspense } from 'react';
import { AppContent } from './App/AppContent';
import { LoadingMessage } from './LoadingMessage';

export type AppProps = {
  patterns: string[];
};

export function App({ patterns }: AppProps) {
  return (
    <Suspense fallback={<LoadingMessage />}>
      <AppContent patterns={patterns}></AppContent>
    </Suspense>
  );
}
