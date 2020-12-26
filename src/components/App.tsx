import { Box, Text, useApp, useInput } from 'ink';
import React, { useState, useEffect } from 'react';
import { lint } from '../eslint/command';
import { RuleStatistic } from '../types';
import { QuestionSentence } from './QuestionSentence';
import { RuleStatisticsTable } from './RuleStatisticsTable';

export type AppProps = {
  patterns: string[];
};

export function App({ patterns }: AppProps) {
  const { exit } = useApp();

  const [confirmed, setConfirmed] = useState<boolean>(false);

  const [ruleStatistics, setRuleStatistics] = useState<RuleStatistic[] | null>(
    null,
  );
  const [selectedRuleIds, setSelectedRuleIds] = useState<string[]>(['semi']);
  const [focusedRuleId, setFocusedRule] = useState<string>('semi');

  const focusedIndex = ruleStatistics?.findIndex(
    (ruleStatistic) => ruleStatistic.ruleId === focusedRuleId,
  );

  useInput((input, key) => {
    if (ruleStatistics === null || focusedIndex === undefined) return;
    if (key.downArrow) {
      const nextIndex = (focusedIndex + 1) % ruleStatistics.length;
      setFocusedRule(ruleStatistics[nextIndex].ruleId);
    } else if (key.upArrow) {
      const nextIndex =
        (focusedIndex - 1 + ruleStatistics.length) % ruleStatistics.length;
      setFocusedRule(ruleStatistics[nextIndex].ruleId);
    } else if (input === ' ') {
      const currentSelected = selectedRuleIds.includes(focusedRuleId);
      if (currentSelected) {
        setSelectedRuleIds(
          selectedRuleIds.filter(
            (selectedRuleId) => selectedRuleId !== focusedRuleId,
          ),
        );
      } else {
        setSelectedRuleIds([...selectedRuleIds, focusedRuleId]);
      }
    } else if (key.return) {
      setConfirmed(true);
      exit();
    }
  });

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
    <>
      <QuestionSentence answers={confirmed ? selectedRuleIds : undefined}>
        Which rule do you want to apply the action to?
      </QuestionSentence>
      <Box flexDirection="column">
        <RuleStatisticsTable
          selectedRuleIds={selectedRuleIds}
          focusedRuleId={focusedRuleId}
          ruleStatistics={ruleStatistics}
        />
      </Box>
    </>
  );
}
