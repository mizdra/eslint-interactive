# AGENTS.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

`eslint-interactive` is an interactive CLI tool that groups ESLint problems by rule and allows users to apply per-rule fixes (auto-fix, disable comments, convert to warnings, etc.). It solves the problem of overwhelming ESLint output when introducing ESLint to a large codebase.

## Commands

```bash
# Build (TypeScript → dist/)
pnpm run build

# Development (build + run against example/)
pnpm run dev

# Unit tests
pnpm run test

# Run a single test file
pnpm exec vitest src/fix/disable-per-line.test.ts

# E2E tests (build first, then run e2e-test/)
pnpm run e2e

# All lint checks
pnpm run lint

# Individual lint checks
pnpm run lint:tsc      # TypeScript type checking
pnpm run lint:eslint   # ESLint
pnpm run lint:prettier # Prettier
```

## Architecture

### Scene-Based Flow

The CLI uses a state machine with scenes in `src/scene/`:

1. **lint** → lint files using ESLint
2. **selectRuleIds** → user picks which rules to act on
3. **selectAction** → user picks an action (fix, disable, warn, etc.)
4. **checkResults** → shows diff, user confirms or goes back

Each scene returns a `NextScene` object indicating the next state.

### Worker Thread Architecture

- `src/cli/run.ts`: Main entry point; spawns a worker thread
- `src/core-worker.ts`: Wraps Core in a worker thread using **comlink** for RPC
- This allows the CLI spinner to animate while linting/fixing runs on the worker thread

### Core API (`src/core.ts`)

The main programmatic API. Key responsibilities:

- Runs ESLint with a custom plugin (`src/plugin.ts`) that captures source code via a "source-code-snatcher" rule
- Supports both legacy (`.eslintrc`) and flat (`eslint.config.js`) ESLint configs via `LegacyESLint`/`FlatESLint`
- Methods: `lint()`, `formatResultSummary()`, `formatResultDetails()`, `applyAutoFixes()`, `disablePerLine()`, `disablePerFile()`, `convertErrorToWarningPerFile()`, `applySuggestions()`, `makeFixableAndFix()`

### Fix System (`src/fix/`)

Low-level fix implementations, one file per action type. Each takes ESLint lint results and returns text edits. Uses ESLint's `Rule.RuleFixer` API internally.

### Action Handlers (`src/action/`)

Higher-level orchestration: call Core methods, show spinners, handle user prompts. One file per action type, mirrors `src/fix/`.

### Formatter (`src/formatter/`)

- `format-by-rules.ts`: Main table output grouping problems by rule
- `format-by-files.ts`: Output grouping by file
- `take-rule-statistics.ts`: Extracts counts (total, fixable, suggestions) from lint results

### ESLint Internals (`src/eslint/`)

This code is forked from the internal ESLint API. Since the API required to implement eslint-interactive is not publicly exposed by ESLint, we are doing this.
