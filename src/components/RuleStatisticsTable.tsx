import { Box, Text } from 'ink';
import React from 'react';
import { RuleStatistic } from '../types';

function calcMaxRuleIdLength(ruleStatistics: RuleStatistic[]): number {
  const ruleIdLengths = ruleStatistics.map(
    (ruleStatistic) => ruleStatistic.ruleId.length,
  );
  return Math.max(...ruleIdLengths, 0);
}

export type RuleStatisticsTableProps = {
  ruleStatistics: RuleStatistic[];
};

export function RuleStatisticsTable({
  ruleStatistics,
}: RuleStatisticsTableProps) {
  // header name
  const ruleColumnHeaderName = 'Rule';
  const errorColumnHeaderName = 'Error (fixable)';
  const warningColumnHeaderName = 'Warning (fixable)';

  // column width
  const ruleColumnWidth = Math.max(
    ruleColumnHeaderName.length,
    calcMaxRuleIdLength(ruleStatistics),
  );
  const errorColumnWidth = errorColumnHeaderName.length;
  const warningColumnWidth = warningColumnHeaderName.length;

  return (
    // ┌───┬───┬───┐
    <Box flexDirection="column">
      <Box>
        <Text>┌─</Text>
        <Text>{'─'.repeat(ruleColumnWidth)}</Text>
        <Text>─┬─</Text>
        <Text>{'─'.repeat(errorColumnWidth)}</Text>
        <Text>─┬─</Text>
        <Text>{'─'.repeat(warningColumnWidth)}</Text>
        <Text>─┐</Text>
      </Box>

      {/* │ <header-name> │ <header-name> │ <header-name> │ */}
      <Box>
        <Text>│ </Text>
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

      {ruleStatistics.map((ruleStatistic) => (
        <React.Fragment key={ruleStatistic.ruleId}>
          {/* ├───┼───┼───┤ */}
          <Box>
            <Text>├─</Text>
            <Text>{'─'.repeat(ruleColumnWidth)}</Text>
            <Text>─┼─</Text>
            <Text>{'─'.repeat(errorColumnWidth)}</Text>
            <Text>─┼─</Text>
            <Text>{'─'.repeat(warningColumnWidth)}</Text>
            <Text>─┤</Text>
          </Box>

          {/* │ <rule-id> │ <error-count> | <warning-count> | */}
          <Box key={ruleStatistic.ruleId}>
            <Text>│ </Text>
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
                {ruleStatistic.warningCount}({ruleStatistic.fixableWarningCount}
                )
              </Text>
            </Box>
            <Text> │</Text>
          </Box>
        </React.Fragment>
      ))}

      {/* └───┴───┴───┘ */}
      <Box>
        <Text>└─</Text>
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
