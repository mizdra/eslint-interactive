import { Box, Text } from 'ink';
import React, { useState, useEffect } from 'react';
import { lint } from '../eslint/command';
import { RuleStatistic } from '../types';
import { RuleStatisticsTable } from './RuleStatisticsTable';

export type AppProps = {
  patterns: string[];
};

export function App({ patterns }: AppProps) {
  const [ruleStatistics, setRuleStatistics] = useState<RuleStatistic[] | null>(
    null,
  );

  useEffect(() => {
    (async () => {
      const { eslint, results, ruleStatistics } = await lint(patterns);
      setRuleStatistics(ruleStatistics);
    })().catch((error) => {
      process.exitCode = 1;
      console.error(error);
    });
  }, []);

  if (ruleStatistics === null) return <Text>loading...</Text>;

  return (
    <Box flexDirection="column">
      <RuleStatisticsTable ruleStatistics={ruleStatistics} />
    </Box>
  );
}
