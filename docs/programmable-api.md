# Programmable API documentation

`eslint-interactive` provides an API for programmatically executing `eslint --fix`, disable per line, etc.

It allows the user to perform complex fix operations :sunglasses:

## Example

```typescript
import { resolve } from 'path';
import { promisify } from 'util';
import { exec } from 'child_process';
import { Core, takeRuleStatistics } from '@mizdra/eslint-interactive';

const core = new Core({
  patterns: ['fixtures'],
  cwd: resolve('./github.com/mizdra/eslint-interactive'),
});
const results = await core.lint();

console.log(core.formatResultSummary(results));
// ┌─────────────────────────────┬───────┬─────────┬────────────┬─────────────────┐
// │ Rule                        │ Error │ Warning │ is fixable │ has suggestions │
// ├─────────────────────────────┼───────┼─────────┼────────────┼─────────────────┤
// │ ban-exponentiation-operator │ 9     │ 0       │ 0          │ 0               │
// ├─────────────────────────────┼───────┼─────────┼────────────┼─────────────────┤
// │ semi                        │ 14    │ 1       │ 15         │ 0               │
// ├─────────────────────────────┼───────┼─────────┼────────────┼─────────────────┤
// │ import/order                │ 3     │ 0       │ 3          │ 0               │
// ├─────────────────────────────┼───────┼─────────┼────────────┼─────────────────┤
// │ prefer-const                │ 4     │ 0       │ 4          │ 0               │
// ├─────────────────────────────┼───────┼─────────┼────────────┼─────────────────┤
// │ no-unused-vars              │ 7     │ 0       │ 0          │ 0               │
// ├─────────────────────────────┼───────┼─────────┼────────────┼─────────────────┤
// │ no-useless-escape           │ 5     │ 0       │ 0          │ 5               │
// ├─────────────────────────────┼───────┼─────────┼────────────┼─────────────────┤
// │ no-unsafe-negation          │ 5     │ 0       │ 0          │ 5               │
// └─────────────────────────────┴───────┴─────────┴────────────┴─────────────────┘

const statistics = takeRuleStatistics(results);
// statistics = [
//   {
//     ruleId: 'ban-exponentiation-operator',
//     errorCount: 9,
//     warningCount: 0,
//     isFixableCount: 0,
//     isFixableErrorCount: 0,
//     isFixableWarningCount: 0,
//     hasSuggestionsCount: 0,
//     hasSuggestionsErrorCount: 0,
//     hasSuggestionsWarningCount: 0,
//   },
//   // ...
// ]

const sortedStatistics = statistics
  // Exclude non-fixable statistic
  .filter((statistic) => statistic.isFixableCount > 0)
  // Sort by descending order of fixable count
  .sort((a, b) => b.isFixableCount - a.isFixableCount);

const ruleIds = sortedStatistics.map((statistic) => statistic.ruleId);

const top3RuleIds = ruleIds.slice(0, 3);

// Fix the top three fixable errors in order.
for (const ruleId of top3RuleIds) {
  console.log(`Fixing ${ruleId}...`);
  await core.fix([ruleId]);
  // git commit
  await execPromise(`git commit -am "fix ${ruleId}"`);
}

console.log('complete!');
```

## Available API

See [src/index.ts](https://github.com/mizdra/eslint-interactive/blob/main/src/index.ts).

## Limitation

- Only the ESM version is available.
  - CJS version is not yet available.
- If you want to use TypeScript, you have to enable `module: node12` or `module: nodenext` in `tsconfig.json`.
  - This means that you need to use TypeScript nightly.
