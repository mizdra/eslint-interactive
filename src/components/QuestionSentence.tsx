import { Box, Text } from 'ink';
import React from 'react';
import { ellipsis, dot } from 'figures';

export type QuestionSentenceProps = {
  answers: string[] | undefined;
};

export const QuestionSentence: React.FunctionComponent<QuestionSentenceProps> = (
  props,
) => {
  return (
    <Box>
      <Text color="green">? </Text>
      <Text>{props.children}</Text>
      {props.answers ? (
        <>
          <Text color="gray"> {dot} </Text>
          <Text color="cyan">{props.answers.join(', ')}</Text>
        </>
      ) : (
        <Text color="gray"> {ellipsis}</Text>
      )}
    </Box>
  );
};
