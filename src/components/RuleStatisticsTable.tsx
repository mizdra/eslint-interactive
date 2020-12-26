import { Box, Spacer, Text } from 'ink';
import React from 'react';
import { RuleStatistic } from '../types';
import { checkboxOn, checkboxOff, pointer } from 'figures';

function calcMaxRuleIdLength(ruleStatistics: RuleStatistic[]): number {
  const ruleIdLengths = ruleStatistics.map(
    (ruleStatistic) => ruleStatistic.ruleId.length,
  );
  return Math.max(...ruleIdLengths, 0);
}

export type RuleStatisticsTableProps = {
  selectedRuleIds: string[];
  focusedRuleId: string;
  ruleStatistics: RuleStatistic[];
};

export function RuleStatisticsTable({
  selectedRuleIds,
  focusedRuleId,
  ruleStatistics,
}: RuleStatisticsTableProps) {
  // header name
  const checkboxColumnHeaderName = '';
  const ruleColumnHeaderName = 'Rule';
  const errorColumnHeaderName = 'Error (fixable)';
  const warningColumnHeaderName = 'Warning (fixable)';

  // column width
  const checkboxColumnWidth = 3;
  const ruleColumnWidth = Math.max(
    ruleColumnHeaderName.length,
    calcMaxRuleIdLength(ruleStatistics),
  );
  const errorColumnWidth = errorColumnHeaderName.length;
  const warningColumnWidth = warningColumnHeaderName.length;

  return (
    // ┌───┬───┬───┬───┐
    <Box flexDirection="column">
      <Box>
        <Text>┌─</Text>
        <Text>{'─'.repeat(checkboxColumnWidth)}</Text>
        <Text>─┬─</Text>
        <Text>{'─'.repeat(ruleColumnWidth)}</Text>
        <Text>─┬─</Text>
        <Text>{'─'.repeat(errorColumnWidth)}</Text>
        <Text>─┬─</Text>
        <Text>{'─'.repeat(warningColumnWidth)}</Text>
        <Text>─┐</Text>
      </Box>

      {/* │ <header-name> │ <header-name> │ <header-name> │ <header-name> │ */}
      <Box>
        <Text>│ </Text>
        <Box width={checkboxColumnWidth}>
          <Text>{checkboxColumnHeaderName}</Text>
        </Box>
        <Text> │ </Text>
        <Box width={ruleColumnWidth}>
          <Text>{ruleColumnHeaderName}</Text>
        </Box>
        <Text> │ </Text>
        <Box width={errorColumnWidth}>
          <Text>{errorColumnHeaderName}</Text>
        </Box>
        <Text> │ </Text>
        <Box width={warningColumnWidth}>
          <Text>{warningColumnHeaderName}</Text>
        </Box>
        <Text> │</Text>
      </Box>

      {ruleStatistics.map((ruleStatistic) => {
        const selected = selectedRuleIds.includes(ruleStatistic.ruleId);
        const focused = focusedRuleId === ruleStatistic.ruleId;
        return (
          <React.Fragment key={ruleStatistic.ruleId}>
            {/* ├───┼───┼───┼───┤ */}
            <Box>
              <Text>├─</Text>
              <Text>{'─'.repeat(checkboxColumnWidth)}</Text>
              <Text>─┼─</Text>
              <Text>{'─'.repeat(ruleColumnWidth)}</Text>
              <Text>─┼─</Text>
              <Text>{'─'.repeat(errorColumnWidth)}</Text>
              <Text>─┼─</Text>
              <Text>{'─'.repeat(warningColumnWidth)}</Text>
              <Text>─┤</Text>
            </Box>

            {/* │ <checkbox> │ <rule-id> │ <error-count> | <warning-count> | */}
            <Box key={ruleStatistic.ruleId}>
              <Text>│ </Text>
              <Box width={checkboxColumnWidth}>
                {focused && <Text>{pointer}</Text>}
                <Spacer />
                <Text color="green">{selected ? checkboxOn : checkboxOff}</Text>
              </Box>
              <Text> │ </Text>
              <Box width={ruleColumnWidth}>
                <Text>{ruleStatistic.ruleId}</Text>
              </Box>
              <Text> │ </Text>
              <Box width={errorColumnWidth}>
                <Text>
                  {ruleStatistic.errorCount}({ruleStatistic.fixableErrorCount})
                </Text>
              </Box>
              <Text> │ </Text>
              <Box width={warningColumnWidth}>
                <Text>
                  {ruleStatistic.warningCount}(
                  {ruleStatistic.fixableWarningCount})
                </Text>
              </Box>
              <Text> │</Text>
            </Box>
          </React.Fragment>
        );
      })}

      {/* └───┴───┴───┴───┘ */}
      <Box>
        <Text>└─</Text>
        <Text>{'─'.repeat(checkboxColumnWidth)}</Text>
        <Text>─┴─</Text>
        <Text>{'─'.repeat(ruleColumnWidth)}</Text>
        <Text>─┴─</Text>
        <Text>{'─'.repeat(errorColumnWidth)}</Text>
        <Text>─┴─</Text>
        <Text>{'─'.repeat(warningColumnWidth)}</Text>
        <Text>─┘</Text>
      </Box>
    </Box>
  );
}
