import { Text } from 'ink';
import Spinner from 'ink-spinner';
import React from 'react';

export type LoadingMessageProps = unknown;

export function LoadingMessage(_props: LoadingMessageProps) {
  return (
    <Text>
      <Text color="green">
        <Spinner type="dots" />
      </Text>
      {' Loading'}
    </Text>
  );
}
