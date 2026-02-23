# Programmable API documentation

> :warning: This feature is experimental and may change significantly.

`eslint-interactive` provides an API for programmatically executing `eslint --fix`, disable per line, etc.

It allows the user to perform complex fix operations :sunglasses:

## Example

```typescript
import { resolve } from 'path';
import { promisify } from 'util';
import { exec } from 'child_process';
import { Core, takeRuleStatistics } from 'eslint-interactive';

const core = new Core({
  patterns: ['example'],
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
  await core.applyAutoFixes(results, [ruleId]);
  // git commit
  await execPromise(`git commit -am "fix ${ruleId}"`);
}

console.log('complete!');
```

## Available API

See [src/index.ts](https://github.com/mizdra/eslint-interactive/blob/main/src/index.ts) for full API implementation
and details.

The `Core()` constructor accepts a subset of the options available in the
[ESLint Node.js API](https://eslint.org/docs/latest/developer-guide/nodejs-api#-new-eslintoptions), including
`overrideConfigFile` and `overrideConfig`. You may use these, for example, to override the configuration completely and
only run a subset of rules if you want:

```typescript
import { Core, takeRuleStatistics } from 'eslint-interactive';

const core = new Core({
  patterns: ['src'],
  cwd: resolve('./github.com/mizdra/eslint-interactive'),
  overrideConfigFile: true,
  overrideConfig: {
    rules: {
      'sort-keys': 'error',
    },
  },
});
```

## `core.applySuggestions`

`core.applySuggestions()` applies [ESLint suggestions](https://eslint.org/docs/latest/developer-guide/working-with-rules#providing-suggestions) for the specified rules. You provide a `SuggestionFilter` function that selects which suggestion to apply for each problem.

```typescript
import { Core } from 'eslint-interactive';

const core = new Core({
  patterns: ['src'],
  cwd: '/path/to/project',
});
const results = await core.lint();

await core.applySuggestions(results, ['no-unsafe-negation'], (suggestions, message, context) => {
  return suggestions.find((s) => s.desc.startsWith('Wrap negation'));
});
```

The `SuggestionFilter` function receives:

- `suggestions` — The list of suggestions (`Linter.LintSuggestion[]`) available for the problem
- `message` — The lint message (`Linter.LintMessage`) that has suggestions
- `context` — The fix context (`FixContext`) containing `filename`, `sourceCode`, `messages`, `ruleIds`, and `fixer`

Return a single `Linter.LintSuggestion` to apply, or `null`/`undefined` to skip.

## `core.makeFixableAndFix`

`core.makeFixableAndFix()` allows you to create fixes for rules that are not auto-fixable. You provide a `FixableMaker` function that converts each lint message into a `Rule.Fix`.

```typescript
import { Core, type FixableMaker } from 'eslint-interactive';

const core = new Core({
  patterns: ['src'],
  cwd: '/path/to/project',
});
const results = await core.lint();

await core.makeFixableAndFix(results, ['no-unused-vars'], (message, range, context) => {
  return context.fixer.insertTextBeforeRange(range, '_');
});
```

The `FixableMaker` function receives:

- `message` — The lint message (`Linter.LintMessage`) to create a fix for
- `range` — The range (`AST.Range`) associated with the message
- `context` — The fix context (`FixContext`) containing `filename`, `sourceCode`, `messages`, `ruleIds`, and `fixer`

Return a `Rule.Fix` object to apply, or `null`/`undefined` to skip the message. Use `context.fixer` (the `Rule.RuleFixer` API) to create fix objects.
