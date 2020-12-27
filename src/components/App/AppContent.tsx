import { Box, Text, useApp, useInput } from 'ink';
import React, { useState } from 'react';
import { lint } from '../../eslint/command';
import { QuestionSentence } from '../QuestionSentence';
import { RuleStatisticsTable } from '../RuleStatisticsTable';
import { useAsyncResource } from 'use-async-resource';

export type AppContentProps = { patterns: string[] };

export function AppContent({ patterns }: AppContentProps) {
  const [lintResultReader] = useAsyncResource(lint, patterns);
  const { eslint, results, ruleStatistics } = lintResultReader();
  const isErrorExist = ruleStatistics.length > 0;

  const { exit } = useApp();

  const [confirmed, setConfirmed] = useState<boolean>(false);

  const [selectedRuleIds, setSelectedRuleIds] = useState<string[]>([]);
  const [focusedRuleId, setFocusedRule] = useState<string | undefined>(
    isErrorExist ? ruleStatistics[0].ruleId : undefined,
  );

  const focusedIndex = ruleStatistics.findIndex(
    (ruleStatistic) => ruleStatistic.ruleId === focusedRuleId,
  );

  useInput((input, key) => {
    if (focusedRuleId === undefined) return;

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

  if (!isErrorExist) {
    return <Text color="green">No error found.</Text>;
  }

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
